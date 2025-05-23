package database

import (
	"fmt"
	"log"
	"os" // Used for GORM Logger

	"time"

	"github.com/gustavoverneck/discordia/server/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB // Global GORM DB instance

// ConnectDB initializes the database connection using GORM and runs AutoMigrate.
func ConnectDB(dbPath string) {
	var err error

	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
		logger.Config{
			SlowThreshold: 200 * time.Millisecond, // Log slow queries as Warning (default 200ms)
			LogLevel:      logger.Info,            // Log level: Info (shows all SQL queries)
			Colorful:      true,                   // Colorful output
		},
	)

	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: newLogger, // Add the configured logger
		// Explicitly enable Foreign Key constraints for SQLite,
		// GORM usually handles "PRAGMA foreign_keys = ON;" on connection.
	})

	if err != nil {
		log.Fatalf("Failed to connect to the database: %v", err)
	}

	fmt.Println("Database connection established successfully.")

	// Enable PRAGMA foreign_keys if necessary (GORM >= v1.20.0 does this automatically for SQLite)
	// if sqlDB, err := DB.DB(); err == nil {
	//     sqlDB.Exec("PRAGMA foreign_keys = ON")
	// }
}

// GetDB returns the GORM DB instance.
func GetDB() *gorm.DB {
	return DB
}

func AutoMigrateModels() {
	if DB == nil {
		log.Fatal("Banco de dados não conectado. Não é possível realizar migrações.")
		return // ou panic("DB is nil")
	}

	// Certifique-se de que seus modelos estão corretos e o pacote models foi importado.
	// O caminho "github.com/gustavoverneck/discordia/server/models" deve estar correto.
	err := DB.AutoMigrate(
		&models.User{},
		&models.Server{},
		&models.Channel{},
		&models.Message{},
		// Adicione quaisquer outros modelos que você tenha definido aqui
		// ex: &models.ServerMember{}, se você tiver uma tabela de junção explícita.
	)

	if err != nil {
		log.Fatalf("Falha ao executar AutoMigrate: %v", err)
	}
	fmt.Println("Migração do banco de dados concluída.")
}
