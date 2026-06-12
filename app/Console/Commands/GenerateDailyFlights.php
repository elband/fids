<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Flight;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use App\Services\FlightService;

class GenerateDailyFlights extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fids:generate-daily-flights';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate daily operational flights from master flights based on today\'s day of week.';

    /**
     * Execute the console command.
     */
    public function handle(FlightService $flightService)
    {
        $today = Carbon::today();
        $this->info("Generating flights for {$today->toDateString()}...");
        
        $generatedCount = $flightService->generateDailyFlights($today);
        
        $this->info("Successfully generated {$generatedCount} flights for today.");
        Log::info("FIDS: Generated {$generatedCount} operational flights for {$today->toDateString()}.");
    }
}
