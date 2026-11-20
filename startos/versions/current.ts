import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.11.1:1',
  releaseNotes: {
    en_US: 'Clearer warnings about the risks of turning on link previews',
    es_ES:
      'Avisos más claros sobre los riesgos de activar las vistas previas de enlaces',
    de_DE:
      'Deutlichere Warnungen zu den Risiken eingeschalteter Linkvorschauen',
    pl_PL: 'Wyraźniejsze ostrzeżenia o ryzyku włączenia podglądów linków',
    fr_FR:
      "Avertissements plus clairs sur les risques d'activer les aperçus de liens",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
