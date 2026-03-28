// Lance un serveur web local pour le front-end
// Nécessite http-server (npm install -g http-server)
cd /d "%~dp0"
start cmd /k "http-server ."
start http://localhost:3000/login.html
