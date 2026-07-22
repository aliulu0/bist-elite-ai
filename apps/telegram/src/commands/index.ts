import { Bot } from 'grammy';
import { startCommand } from './start.command';
import { helpCommand } from './help.command';
import { scanCommand } from './scan.command';
import { topCommand } from './top.command';
import { eliteCommand } from './elite.command';
import { portfolioCommand } from './portfolio.command';
import { watchlistCommand } from './watchlist.command';
import { signalCommand } from './signal.command';
import { backtestCommand } from './backtest.command';
import { settingsCommand } from './settings.command';
import { statusCommand } from './status.command';
import { aboutCommand } from './about.command';

export function registerCommands(bot: Bot) {
  bot.command('start', startCommand);
  bot.command('help', helpCommand);
  bot.command('scan', scanCommand);
  bot.command('top', topCommand);
  bot.command('elite', eliteCommand);
  bot.command('portfolio', portfolioCommand);
  bot.command('watchlist', watchlistCommand);
  bot.command('signal', signalCommand);
  bot.command('backtest', backtestCommand);
  bot.command('settings', settingsCommand);
  bot.command('status', statusCommand);
  bot.command('about', aboutCommand);
}
