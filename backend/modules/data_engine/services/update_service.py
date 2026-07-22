import time
import asyncio
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from modules.data_engine.services.company_service import CompanyService
from modules.data_engine.services.price_service import PriceService
from modules.data_engine.services.financial_service import FinancialService
from modules.data_engine.services.technical_service import TechnicalService
from modules.data_engine.services.sector_service import SectorService
from modules.data_engine.providers.base.provider_registry import registry
from modules.data_engine.providers.models.enums import ProviderType
from modules.data_engine.utils.logger import logger
from modules.data_engine.utils.progress import progress_tracker, UpdateStage, UpdateProgress


class UpdateService:
    def __init__(self, db: Session):
        self.db = db
        self.company_service = CompanyService(db)
        self.price_service = PriceService(db)
        self.financial_service = FinancialService(db)
        self.technical_service = TechnicalService(db)
        self.sector_service = SectorService(db)

    def get_progress(self) -> dict:
        current = progress_tracker.current
        if current:
            return current.to_dict()
        history = progress_tracker.history
        if history:
            return {"status": "idle", "last_update": history[-1].to_dict()}
        return {"status": "idle"}

    async def update_companies(self) -> dict:
        result = await self.company_service.sync_companies()
        return result

    async def update_prices(self) -> dict:
        progress = progress_tracker.start("prices")
        try:
            progress.set_stage(UpdateStage.DOWNLOADING)
            companies = self.company_service.get_all()
            progress.set_total(len(companies))

            total_updated = 0
            errors = []
            for company in companies:
                progress.set_stage(UpdateStage.PROCESSING)
                result = await self.price_service.update_prices_for_company(
                    company.stock_code, company.id
                )
                if result["success"]:
                    count = result.get("count", 0)
                    total_updated += count
                    progress.update_company(
                        company.stock_code, success=True, prices=count
                    )
                else:
                    errors.append(f"{company.stock_code}: {result['message']}")
                    progress.update_company(company.stock_code, success=False)
                    progress.add_error(f"{company.stock_code}: {result['message']}")

            progress_tracker.complete()
            return {
                "success": True,
                "message": f"Updated prices for {len(companies)} companies",
                "total_updated": total_updated,
                "errors": errors,
            }
        except Exception as e:
            progress_tracker.fail(str(e))
            logger.error(f"Price update pipeline failed: {str(e)}")
            return {"success": False, "message": str(e)}

    async def update_financials(self) -> dict:
        progress = progress_tracker.start("financials")
        try:
            progress.set_stage(UpdateStage.DOWNLOADING)
            companies = self.company_service.get_all()
            progress.set_total(len(companies))

            total_updated = 0
            errors = []
            for company in companies:
                progress.set_stage(UpdateStage.PROCESSING)
                result = await self.financial_service.update_financials_for_company(
                    company.stock_code, company.id
                )
                if result["success"]:
                    count = result.get("count", 0)
                    total_updated += count
                    progress.update_company(
                        company.stock_code, success=True, financials=count
                    )
                else:
                    errors.append(f"{company.stock_code}: {result['message']}")
                    progress.update_company(company.stock_code, success=False)
                    progress.add_error(f"{company.stock_code}: {result['message']}")

            progress_tracker.complete()
            return {
                "success": True,
                "message": f"Updated financials for {len(companies)} companies",
                "total_updated": total_updated,
                "errors": errors,
            }
        except Exception as e:
            progress_tracker.fail(str(e))
            logger.error(f"Financial update pipeline failed: {str(e)}")
            return {"success": False, "message": str(e)}

    async def update_technicals(self) -> dict:
        progress = progress_tracker.start("technicals")
        try:
            progress.set_stage(UpdateStage.PROCESSING)
            companies = self.company_service.get_all()
            progress.set_total(len(companies))

            total_updated = 0
            errors = []
            for company in companies:
                result = await self.technical_service.update_technicals_for_company(
                    company.stock_code, company.id
                )
                if result["success"]:
                    count = result.get("count", 0)
                    total_updated += count
                    progress.update_company(
                        company.stock_code, success=True, technicals=count
                    )
                else:
                    errors.append(f"{company.stock_code}: {result['message']}")
                    progress.update_company(company.stock_code, success=False)
                    progress.add_error(f"{company.stock_code}: {result['message']}")

            progress_tracker.complete()
            return {
                "success": True,
                "message": f"Updated technicals for {len(companies)} companies",
                "total_updated": total_updated,
                "errors": errors,
            }
        except Exception as e:
            progress_tracker.fail(str(e))
            logger.error(f"Technical update pipeline failed: {str(e)}")
            return {"success": False, "message": str(e)}

    async def update_all(self) -> dict:
        start_time = time.time()
        progress = progress_tracker.start("full_update")
        logger.update_start("FULL UPDATE")

        results = {
            "companies": None,
            "prices": None,
            "financials": None,
            "technicals": None,
            "sectors": None,
        }

        try:
            logger.info("Step 1: Syncing companies...")
            progress.set_stage(UpdateStage.DOWNLOADING)
            results["companies"] = await self.update_companies()

            logger.info("Step 2: Updating prices...")
            progress.set_stage(UpdateStage.DOWNLOADING)
            results["prices"] = await self.update_prices()

            logger.info("Step 3: Updating financial reports...")
            progress.set_stage(UpdateStage.PROCESSING)
            results["financials"] = await self.update_financials()

            logger.info("Step 4: Calculating technical indicators...")
            progress.set_stage(UpdateStage.PROCESSING)
            results["technicals"] = await self.update_technicals()

            logger.info("Step 5: Updating sector statistics...")
            progress.set_stage(UpdateStage.SAVING)
            results["sectors"] = await self.sector_service.update_sector_strength()

            duration = time.time() - start_time
            total_prices = results["prices"].get("total_updated", 0) if results["prices"] else 0
            total_financials = results["financials"].get("total_updated", 0) if results["financials"] else 0
            total_technicals = results["technicals"].get("total_updated", 0) if results["technicals"] else 0

            all_errors = []
            for key, res in results.items():
                if res and not res.get("success", True):
                    all_errors.extend(res.get("errors", []))

            progress_tracker.complete()
            logger.update_complete(
                "FULL UPDATE",
                duration,
                len(self.company_service.get_all()) - len(all_errors),
                len(all_errors),
            )

            provider_status = registry.get_all_status()

            return {
                "success": True,
                "message": "Full update completed",
                "duration": round(duration, 2),
                "results": results,
                "summary": {
                    "companies_synced": results["companies"].get("count", 0) if results["companies"] else 0,
                    "prices_updated": total_prices,
                    "financials_updated": total_financials,
                    "technicals_updated": total_technicals,
                    "sectors_updated": results["sectors"].get("count", 0) if results["sectors"] else 0,
                    "errors_count": len(all_errors),
                    "errors": all_errors[:20],
                },
                "providers_used": {
                    ptype: status.get("active_provider")
                    for ptype, status in provider_status.items()
                },
            }
        except Exception as e:
            duration = time.time() - start_time
            progress_tracker.fail(str(e))
            logger.error(f"Full update pipeline failed after {duration:.2f}s: {str(e)}")
            return {
                "success": False,
                "message": str(e),
                "duration": round(duration, 2),
                "results": results,
            }

    def get_last_update_info(self) -> dict:
        history = progress_tracker.history
        if not history:
            return {"last_update": None, "status": "never_updated"}
        last = history[-1]
        return {
            "last_update": {
                "stage": last.stage.value,
                "duration": last.duration,
                "success_count": last.success_count,
                "failed_count": last.failed_count,
                "updated_prices": last.updated_prices,
                "updated_financials": last.updated_financials,
                "updated_technicals": last.updated_technicals,
            },
            "total_updates": len(history),
        }
