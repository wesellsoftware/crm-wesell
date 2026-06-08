import type { BoardTemplate } from '../types'
import { createStatusOption } from '../column-types'

const LEAD_STATUS = [
  createStatusOption('Novo lead', '#FFD700'),
  createStatusOption('Contatado', '#F4A545'),
  createStatusOption('Qualificado', '#45F47F'),
  createStatusOption('Desqualificado', '#F44545'),
  createStatusOption('Em espera', '#45D4F4'),
]

const CONTACT_TYPE = [
  createStatusOption('Lead', '#D7FE65'),
  createStatusOption('Qualified (Existing Account)', '#45F47F'),
  createStatusOption('Qualified (New Account)', '#45D4F4'),
]

const CONTACT_PRIORITY = [
  createStatusOption('Alta', '#F4A545'),
  createStatusOption('Média', '#4342F5'),
  createStatusOption('Baixa', '#45D4F4'),
]

const DEAL_STAGE = [
  createStatusOption('Descoberta', '#4342F5'),
  createStatusOption('Proposta', '#45D4F4'),
  createStatusOption('Negociação', '#F4A545'),
  createStatusOption('Fechado/Ganho', '#45F47F'),
  createStatusOption('Perdido', '#F44545'),
]

const SECTOR_TAGS = [
  createStatusOption('Software', '#45D4F4'),
  createStatusOption('Vendas e marketing', '#45F47F'),
  createStatusOption('Finanças', '#7845F4'),
  createStatusOption('Saúde', '#F4A545'),
]

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    slug: 'contatos',
    name: 'Contatos',
    icon: 'users',
    position: 0,
    groups: [{ name: 'Contatos', color: '#4342F5' }],
    columns: [
      { name: 'Contato', type: 'text', is_primary: true },
      { name: 'Conta', type: 'relation', settings: { target_board_slug: 'contas' } },
      { name: 'Cargo', type: 'text' },
      { name: 'Tipo', type: 'status', settings: { options: CONTACT_TYPE } },
      { name: 'Prioridade', type: 'status', settings: { options: CONTACT_PRIORITY } },
      { name: 'Próxima interação', type: 'date' },
      { name: 'Telefone', type: 'phone' },
      { name: 'E-mail', type: 'email' },
    ],
  },
  {
    slug: 'negociacoes',
    name: 'Negociações',
    icon: 'dollar-sign',
    position: 1,
    groups: [
      { name: 'Oportunidades ativas', color: '#4342F5' },
      { name: 'Fechado/Ganho', color: '#45F47F' },
    ],
    columns: [
      { name: 'Oportunidade', type: 'text', is_primary: true },
      { name: 'Cronograma', type: 'timeline' },
      { name: 'Etapa', type: 'status', settings: { options: DEAL_STAGE } },
      { name: 'Responsável', type: 'person' },
      { name: 'Valor da negociação', type: 'currency', settings: { currency: 'BRL' } },
      { name: 'Contato', type: 'relation', settings: { target_board_slug: 'contatos' } },
    ],
  },
  {
    slug: 'leads',
    name: 'Leads',
    icon: 'target',
    position: 2,
    groups: [{ name: 'Novos Leads', color: '#4342F5' }],
    columns: [
      { name: 'Lead', type: 'text', is_primary: true },
      { name: 'Status', type: 'status', settings: { options: LEAD_STATUS } },
      { name: 'Cronograma', type: 'timeline' },
      { name: 'Empresa', type: 'text' },
      { name: 'Cargo', type: 'text' },
      { name: 'Lead Score', type: 'number' },
      { name: 'E-mail', type: 'email' },
    ],
  },
  {
    slug: 'contas',
    name: 'Contas',
    icon: 'building-2',
    position: 3,
    groups: [{ name: 'Empresas', color: '#4342F5' }],
    columns: [
      { name: 'Conta', type: 'text', is_primary: true },
      { name: 'Domínio', type: 'url' },
      { name: 'Contato', type: 'relation', settings: { target_board_slug: 'contatos' } },
      { name: 'Negociação', type: 'relation', settings: { target_board_slug: 'negociacoes' } },
      { name: 'Setor', type: 'tags', settings: { options: SECTOR_TAGS } },
    ],
  },
]

export const BOARD_SLUGS = BOARD_TEMPLATES.map(t => t.slug)

export function getBoardTemplate(slug: string) {
  return BOARD_TEMPLATES.find(t => t.slug === slug)
}
