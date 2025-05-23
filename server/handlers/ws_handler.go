// Em server/handlers/handlers.go (ou ws_handlers.go)
package handlers

import (
	// ... (outros imports: gin, log, net/http, gorm) ...
	"log"
	"net/http"

	"encoding/json"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/gustavoverneck/discordia/server/models"
	"gorm.io/gorm"
)

// Upgrader WebSocket (pode ser definido aqui ou em main.go)
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Para desenvolvimento, permitir localhost:3000 e tauri://localhost
		// Em produção, seja mais específico.
		origin := r.Header.Get("Origin")
		return origin == "http://localhost:3000" || origin == "tauri://localhost" || origin == ""
	},
}

type WebSocketMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"` // Usamos interface{} para lidar com diferentes payloads
}

// Payload específico para 'join_channel'
type JoinChannelPayload struct {
	ChannelID uint   `json:"channelId"`
	Token     string `json:"token"`
}

// Payload específico para 'new_message'
type NewMessagePayload struct {
	ChannelID uint   `json:"channelId"`
	Content   string `json:"content"`
}

var clients = make(map[*websocket.Conn]uint) // conn -> userID
var channelSubscriptions = make(map[uint]map[*websocket.Conn]bool)

// HandleWebSocketChat é um exemplo de handler. Você precisará de uma estrutura mais robusta
// para gerenciar múltiplos clientes, canais, autenticação, etc.
// Este é um ponto de partida MUITO SIMPLES.
func HandleWebSocketChat(w http.ResponseWriter, r *http.Request, db *gorm.DB) { // Recebe DB
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Falha ao fazer upgrade para WebSocket: %v", err)
		return
	}
	defer func() {
		// Limpeza ao desconectar: remover cliente de 'clients' e de todas as 'channelSubscriptions'
		userID, ok := clients[conn]
		if ok {
			for channelID, connsInChannel := range channelSubscriptions {
				if _, inChannel := connsInChannel[conn]; inChannel {
					delete(channelSubscriptions[channelID], conn)
					log.Printf("Usuário %d removido do canal %d nas subscriptions do WebSocket", userID, channelID)
					// Opcional: notificar outros no canal que o usuário saiu
				}
			}
		}
		delete(clients, conn)
		conn.Close()
		log.Println("Cliente desconectado do WebSocket e subscriptions limpas")
	}()

	log.Println("Novo cliente conectado via WebSocket")

	// Loop para ler mensagens do cliente
	for {
		messageType, p, err := conn.ReadMessage() // p é []byte
		if err != nil {
			// ... (tratamento de erro de leitura como antes) ...
			break
		}

		if messageType == websocket.TextMessage {
			log.Printf("Mensagem de texto recebida: %s", string(p))

			var msg WebSocketMessage
			if err := json.Unmarshal(p, &msg); err != nil {
				log.Printf("Erro ao decodificar JSON do WebSocket: %v", err)
				// Opcional: enviar mensagem de erro de volta ao cliente
				// conn.WriteJSON(gin.H{"error": "Formato de mensagem inválido"})
				continue
			}

			switch msg.Type {
			case "join_channel":
				payloadBytes, _ := json.Marshal(msg.Payload)
				var joinPayload JoinChannelPayload
				if err := json.Unmarshal(payloadBytes, &joinPayload); err != nil {
					log.Printf("Erro ao decodificar payload de join_channel: %v", err)
					continue
				}

				log.Printf("Cliente tentando entrar no canal: %d com token: %s", joinPayload.ChannelID, joinPayload.Token)

				// 1. Autenticar o token
				claims, err := ValidateJWT(joinPayload.Token) // Sua função ValidateJWT
				if err != nil {
					log.Printf("Token inválido para join_channel: %v", err)
					conn.WriteJSON(gin.H{"type": "error", "payload": "Token inválido ou expirado."})
					// conn.Close() // Pode fechar a conexão se a autenticação falhar
					continue
				}
				userID := claims.UserID
				clients[conn] = userID // Associa a conexão ao userID

				// 2. Inscrever no canal (lógica MUITO SIMPLIFICADA)
				if channelSubscriptions[joinPayload.ChannelID] == nil {
					channelSubscriptions[joinPayload.ChannelID] = make(map[*websocket.Conn]bool)
				}
				channelSubscriptions[joinPayload.ChannelID][conn] = true
				log.Printf("Usuário %d (conexão %p) inscrito no canal %d", userID, conn, joinPayload.ChannelID)
				conn.WriteJSON(gin.H{"type": "join_success", "payload": gin.H{"channelId": joinPayload.ChannelID, "message": "Inscrito no canal com sucesso!"}})

			case "new_message":
				payloadBytes, _ := json.Marshal(msg.Payload)
				var newMsgPayload NewMessagePayload
				if err := json.Unmarshal(payloadBytes, &newMsgPayload); err != nil {
					log.Printf("Erro ao decodificar payload de new_message: %v", err)
					continue
				}

				// 1. Obter userID da conexão (deve ter sido feito no join_channel)
				authorID, authenticated := clients[conn]
				if !authenticated {
					log.Println("Mensagem recebida de conexão não autenticada/não associada a usuário.")
					conn.WriteJSON(gin.H{"type": "error", "payload": "Não autenticado para enviar mensagem."})
					continue
				}

				// Opcional: Verificar se o usuário está realmente inscrito no newMsgPayload.ChannelID

				// 2. Salvar mensagem no banco de dados
				dbMessage := models.Message{
					ChannelID: newMsgPayload.ChannelID,
					AuthorID:  authorID,
					Content:   newMsgPayload.Content,
				}
				if result := db.Create(&dbMessage); result.Error != nil {
					log.Printf("Erro ao salvar mensagem no DB: %v", result.Error)
					conn.WriteJSON(gin.H{"type": "error", "payload": "Falha ao salvar mensagem."})
					continue
				}

				// Precisamos carregar o autor para enviar na resposta
				var authorDetails models.User
				db.First(&authorDetails, authorID) // Simples; adicione tratamento de erro

				// Formatar para MessageResponse DTO
				messageForBroadcast := MessageResponse{ // Reutilize o DTO MessageResponse
					ID:        dbMessage.ID,
					Content:   dbMessage.Content,
					CreatedAt: dbMessage.CreatedAt,
					Author: struct {
						ID        uint   `json:"id"`
						Username  string `json:"username"`
						AvatarURL string `json:"avatarUrl,omitempty"`
					}{
						ID:        authorDetails.ID,
						Username:  authorDetails.Username,
						AvatarURL: authorDetails.AvatarURL,
					},
					ChannelID: dbMessage.ChannelID,
				}

				// 3. Transmitir (Broadcast) para todos no canal
				log.Printf("Transmitindo mensagem para canal %d", newMsgPayload.ChannelID)
				if connsInChannel, ok := channelSubscriptions[newMsgPayload.ChannelID]; ok {
					for clientConn := range connsInChannel {
						// Não enviar para si mesmo se já estiver atualizando a UI otimisticamente,
						// ou enviar para todos e o frontend decide.
						// if clientConn == conn { continue } // Exemplo: não enviar para o remetente

						err := clientConn.WriteJSON(messageForBroadcast) // Envia o DTO
						if err != nil {
							log.Printf("Erro ao transmitir mensagem para cliente %p: %v", clientConn, err)
							// Opcional: remover este cliente se houver erro de escrita (pode estar desconectado)
							// clientConn.Close()
							// delete(clients, clientConn)
							// delete(channelSubscriptions[newMsgPayload.ChannelID], clientConn)
						}
					}
				}

			default:
				log.Printf("Tipo de mensagem WebSocket desconhecido: %s", msg.Type)
			}
		}
	}
}
