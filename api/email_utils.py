import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_reset_email(to_email: str, reset_link: str):
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "비밀번호 재설정 안내"
    msg["From"] = smtp_user
    msg["To"] = to_email

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>비밀번호 재설정</h2>
        <p>아래 버튼을 클릭하여 비밀번호를 재설정하세요.</p>
        <p>링크는 <strong>30분</strong> 동안 유효합니다.</p>
        <a href="{reset_link}"
           style="display:inline-block; padding:12px 24px; background:#4a90e2;
                  color:white; text-decoration:none; border-radius:4px; margin:16px 0;">
            비밀번호 재설정
        </a>
        <p style="color:#999; font-size:12px;">
            본인이 요청하지 않은 경우 이 메일을 무시하세요.
        </p>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, to_email, msg.as_string())
