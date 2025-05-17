package mail

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
)

func SendVerificationEmail(to, token string) error {
	from := os.Getenv("EMAIL_FROM")
	pass := os.Getenv("EMAIL_PASSWORD")
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")

	auth := smtp.PlainAuth("", from, pass, host)

	msg := fmt.Sprintf("Subject: Verify your account\n\nClick to verify:\nhttp://localhost:8080/api/verify?token=%s", token)
	addr := host + ":" + port

	err := smtp.SendMail(addr, auth, from, []string{to}, []byte(msg))
	if err != nil {
		log.Printf("Error sending to %s: %v", to, err)
	}
	return err
}
