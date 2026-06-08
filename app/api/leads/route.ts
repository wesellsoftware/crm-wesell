import { NextResponse } from 'next/server'
import { createExternalLead, type ExternalLeadInput } from '@/lib/leads/create-external-lead'

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.LEADS_CORS_ORIGIN ?? '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders })
}

function isAuthorized(request: Request) {
  const apiKey = process.env.LEADS_API_KEY
  if (!apiKey) return false

  const headerKey = request.headers.get('x-api-key')
  const authHeader = request.headers.get('authorization')
  const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  return headerKey === apiKey || bearerKey === apiKey
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(request: Request) {
  if (!process.env.LEADS_API_KEY) {
    return jsonResponse({ error: 'API de leads não configurada.' }, 503)
  }

  if (!isAuthorized(request)) {
    return jsonResponse({ error: 'Não autorizado.' }, 401)
  }

  let body: ExternalLeadInput
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'JSON inválido.' }, 400)
  }

  const result = await createExternalLead(body, {
    organizationId: process.env.LEADS_ORGANIZATION_ID,
  })

  if ('error' in result) {
    const status = result.error.includes('obrigatório') ? 400 : 500
    return jsonResponse({ error: result.error }, status)
  }

  return jsonResponse(
    {
      success: true,
      lead: result.lead,
    },
    201
  )
}

export async function GET() {
  return jsonResponse({
    endpoint: '/api/leads',
    method: 'POST',
    auth: 'Header x-api-key ou Authorization: Bearer <LEADS_API_KEY>',
    required_fields: ['nome'],
    optional_fields: [
      'email',
      'whatsapp',
      'cidade',
      'empresa',
      'segmento',
      'servico',
      'ideia_projeto',
      'cargo',
      'faturamento',
      'colaboradores',
      'origem',
    ],
    example: {
      nome: 'Sérgio',
      whatsapp: '(55) 99639-0097',
      cidade: 'Santa Maria',
      email: 'Sergiomontipo@gmail.com',
      empresa: 'WeSell',
      segmento: 'Tecnologia',
      servico: 'Websites',
      ideia_projeto: 'Criação de landing page para ecommerce',
      cargo: 'Presidente ou CEO',
      faturamento: 'R$1 a R$5 milhões/ano',
      colaboradores: '6 a 10',
    },
  })
}
