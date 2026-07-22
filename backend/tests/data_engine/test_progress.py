import pytest
from modules.data_engine.utils.progress import ProgressTracker, UpdateStage, UpdateProgress


class TestProgressTracker:
    def setup_method(self):
        self.tracker = ProgressTracker()

    def test_initial_state(self):
        assert self.tracker.current is None
        assert len(self.tracker.history) == 0

    def test_start_update(self):
        progress = self.tracker.start("test_update")
        assert progress is not None
        assert progress.stage == UpdateStage.DOWNLOADING
        assert self.tracker.current is progress

    def test_set_stage(self):
        self.tracker.start("test")
        self.tracker.set_stage(UpdateStage.PROCESSING)
        assert self.tracker.current.stage == UpdateStage.PROCESSING

    def test_set_total(self):
        self.tracker.start("test")
        self.tracker.set_total(100)
        assert self.tracker.current.total_companies == 100

    def test_update_company(self):
        self.tracker.start("test")
        self.tracker.set_total(10)
        self.tracker.update_company("GARAN", success=True, prices=5)
        assert self.tracker.current.processed_companies == 1
        assert self.tracker.current.success_count == 1
        assert self.tracker.current.updated_prices == 5

    def test_add_error(self):
        self.tracker.start("test")
        self.tracker.add_error("Something went wrong")
        assert len(self.tracker.current.errors) == 1

    def test_complete(self):
        self.tracker.start("test")
        result = self.tracker.complete()
        assert result.stage == UpdateStage.COMPLETED
        assert self.tracker.current is None
        assert len(self.tracker.history) == 1

    def test_fail(self):
        self.tracker.start("test")
        result = self.tracker.fail("Error occurred")
        assert result.stage == UpdateStage.FAILED
        assert self.tracker.current is None


class TestUpdateProgress:
    def test_progress_percent(self):
        progress = UpdateProgress(total_companies=100, processed_companies=50)
        assert progress.progress_percent == 50.0

    def test_progress_percent_zero_total(self):
        progress = UpdateProgress(total_companies=0, processed_companies=0)
        assert progress.progress_percent == 0.0

    def test_to_dict(self):
        progress = UpdateProgress(total_companies=100, processed_companies=50)
        d = progress.to_dict()
        assert "stage" in d
        assert "progress_percent" in d
        assert d["progress_percent"] == 50.0
