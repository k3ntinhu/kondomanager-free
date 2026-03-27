<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('piani_rate', function (Blueprint $table) {
            $table->date('data_delibera_assemblea')->nullable()->after('stato');
            $table->string('numero_verbale', 50)->nullable()->after('data_delibera_assemblea');
            $table->text('nota_approvazione')->nullable()->after('numero_verbale');
            $table->foreignId('approvato_da_user_id')->nullable()->after('nota_approvazione')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('approvato_il')->nullable()->after('approvato_da_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('piani_rate', function (Blueprint $table) {
            $table->dropForeign(['approvato_da_user_id']);
            $table->dropColumn([
                'data_delibera_assemblea',
                'numero_verbale',
                'nota_approvazione',
                'approvato_da_user_id',
                'approvato_il',
            ]);
        });
    }
};
