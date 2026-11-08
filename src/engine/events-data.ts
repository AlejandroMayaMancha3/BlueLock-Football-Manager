import { DecisionEvent } from '@/types/football-manager';

export const DECISION_EVENTS_POOL: DecisionEvent[] = [
  {
    id: 'event-press-provocation',
    title: 'Rueda de Prensa Incendiaria',
    speaker: 'Jinpachi Ego / Periodistas de la NEL',
    narrative:
      'Los medios internacionales cuestionan si tu equipo tiene suficiente hambre goleadora o si son simples piezas obedientes sin instinto asesino. ¿Cómo respondes?',
    options: [
      {
        label: 'Desatar el Ego',
        description: 'Declarar que en este vestuario solo sobreviven los depredadores.',
        impact: {
          squadMoraleChange: 8,
          boardTrustChange: -4,
        },
      },
      {
        label: 'Prudencia Institucional',
        description: 'Priorizar el trabajo táctico colectivo y la disciplina defensiva.',
        impact: {
          squadMoraleChange: -5,
          boardTrustChange: 7,
        },
      },
      {
        label: 'Retar al Próximo Rival',
        description: 'Garantizar una victoria aplastante en el próximo encuentro ante los aficionados.',
        impact: {
          squadMoraleChange: 12,
          boardTrustChange: 2,
        },
      },
    ],
  },
  {
    id: 'event-sponsor-commercial',
    title: 'Oferta de Patrocinio Global',
    speaker: 'Director Comercial del Club',
    narrative:
      'Una multinacional tecnológica de Tokio ofrece una inyección de capital inmediata a cambio de obligar a tus delanteros a rodar spots publicitarios intensivos antes de la próxima jornada.',
    options: [
      {
        label: 'Aceptar el Contrato Millonario',
        description: 'Ingresar 120.000.000 ¥ extra a las arcas, sacrificando algo de descanso.',
        impact: {
          budgetChangeYen: 120000000,
          squadMoraleChange: -6,
        },
      },
      {
        label: 'Rechazar la Distracción',
        description: 'El fútbol puro y el descanso son innegociables para alcanzar el Flow.',
        impact: {
          budgetChangeYen: 0,
          squadMoraleChange: 6,
          boardTrustChange: -3,
        },
      },
    ],
  },
  {
    id: 'event-wildcard-audition',
    title: 'Informe Secreto del Wild Card',
    speaker: 'Jinpachi Ego',
    narrative:
      'Un jugador descartado ha sobrevivido al régimen hiperbólico del Wild Card y pide una audición privada para unirse de inmediato al primer equipo.',
    options: [
      {
        label: 'Incorporar al Monstruo Físico',
        description: 'Gastar 40.000.000 ¥ en su ficha médica y sumarlo a la plantilla.',
        impact: {
          budgetChangeYen: -40000000,
          squadMoraleChange: 4,
          boardTrustChange: 5,
        },
      },
      {
        label: 'Mantener la Jerarquía Actual',
        description: 'Evitar tensiones en el vestuario con los titulares consolidados.',
        impact: {
          squadMoraleChange: 3,
          boardTrustChange: 0,
        },
      },
    ],
  },
  {
    id: 'event-locker-room-clash',
    title: 'Guerra de Egos en el Entrenamiento',
    speaker: 'Segundo Entrenador',
    narrative:
      'Dos de tus principales atacantes han llegado a las manos tras discutir sobre quién debe lanzar los penaltis y asumir el protagonismo ofensivo.',
    options: [
      {
        label: 'Fomentar la Rivalidad Caníbal',
        description: 'El que marque más goles en el próximo partido será el tirador oficial.',
        impact: {
          squadMoraleChange: 7,
          boardTrustChange: -4,
        },
      },
      {
        label: 'Sanción Económica a Ambos',
        description: 'Multar a ambos con 15.000.000 ¥ para dejar clara la autoridad del club.',
        impact: {
          budgetChangeYen: 30000000,
          squadMoraleChange: -8,
          boardTrustChange: 8,
        },
      },
      {
        label: 'Designar al Capitán como Mediador',
        description: 'Resolver el conflicto internamente sin castigos externos.',
        impact: {
          squadMoraleChange: 2,
          boardTrustChange: 3,
        },
      },
    ],
  },
];
