export function mapAuthUrlError(errorCode: string | null, description?: string | null): string {
  switch (errorCode) {
    case 'otp_expired':
      return 'O link do convite expirou ou já foi usado. Peça ao administrador para enviar um novo convite.'
    case 'access_denied':
      if (description?.toLowerCase().includes('expired')) {
        return 'O link expirou. Solicite um novo convite ou e-mail de acesso.'
      }
      return 'Acesso negado. O link pode ser inválido ou já ter sido utilizado.'
    case 'invalid_request':
      return 'Link de autenticação inválido. Tente abrir o link mais recente enviado por e-mail.'
    default:
      if (description) {
        return decodeURIComponent(description.replace(/\+/g, ' '))
      }
      return 'Não foi possível concluir a autenticação. Tente novamente ou solicite um novo link.'
  }
}
