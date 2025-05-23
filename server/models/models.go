package models // ou package database, ou outro de sua escolha

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model           // ID, CreatedAt, UpdatedAt, DeletedAt
	Username      string `gorm:"type:varchar(100);uniqueIndex;not null"`
	Email         string `gorm:"type:varchar(100);uniqueIndex;not null"`
	PasswordHash  string `gorm:"not null"`
	AvatarURL     string
	Status        string    `gorm:"type:varchar(50);default:'offline'"`
	OwnedServers  []Server  `gorm:"foreignKey:OwnerID"`        // Servidores que este usuário possui
	MemberServers []*Server `gorm:"many2many:server_members;"` // Servidores dos quais este usuário é membro
	Messages      []Message `gorm:"foreignKey:AuthorID"`
}

type Server struct {
	gorm.Model
	OwnerID     uint   `gorm:"not null"`
	Owner       User   `gorm:"foreignKey:OwnerID"` // Relacionamento Belongs To User
	ServerName  string `gorm:"type:varchar(255);not null"`
	Description string
	IconURL     string
	Members     []*User   `gorm:"many2many:server_members;"` // Membros do servidor
	Channels    []Channel `gorm:"foreignKey:ServerID"`       // Canais do servidor
}

type Channel struct {
	gorm.Model
	ServerID    uint   `gorm:"not null"`
	Server      Server `gorm:"foreignKey:ServerID"` // Relacionamento Belongs To Server
	ChannelName string `gorm:"type:varchar(100);not null"`
	// Para SQLite, o CHECK constraint pode não ser criado por AutoMigrate.
	// Você pode precisar de DDL customizado ou validação na aplicação.
	ChannelType string `gorm:"type:varchar(50);not null"` // "TEXT" ou "VOICE"
	Topic       string
	Position    int       `gorm:"default:0"`
	Messages    []Message `gorm:"foreignKey:ChannelID"`
}

type Message struct {
	gorm.Model
	ChannelID       uint      `gorm:"not null"`
	Channel         Channel   `gorm:"foreignKey:ChannelID"` // Relacionamento Belongs To Channel
	AuthorID        uint      `gorm:"not null"`
	Author          User      `gorm:"foreignKey:AuthorID"` // Relacionamento Belongs To User
	Content         string    `gorm:"type:text;not null"`
	ParentMessageID *uint     // Ponteiro para permitir NULL (respostas a mensagens)
	ParentMessage   *Message  `gorm:"foreignKey:ParentMessageID;references:ID"`
	Replies         []Message `gorm:"foreignKey:ParentMessageID;references:ID"`
}
