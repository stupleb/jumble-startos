import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '26.11.2:0',
  releaseNotes: {
    en_US:
      "Updates Jumble to 26.11.2, which adds a feed summary sidebar and profile sharing. A relay at a local address, such as one ending in .local, connects only when it's in your Read & Write Relays or you open its feed.",
    es_ES:
      'Actualiza Jumble a 26.11.2, que añade una barra lateral con el resumen del feed y la opción de compartir perfiles. Un relé en una dirección local, como una que termina en .local, solo se conecta si está en tus Read & Write Relays o si abres su feed.',
    de_DE:
      'Aktualisiert Jumble auf 26.11.2, das eine Feed-Zusammenfassung in der Seitenleiste und das Teilen von Profilen hinzufügt. Ein Relay unter einer lokalen Adresse, etwa einer, die auf .local endet, verbindet sich nur, wenn es in deinen Read & Write Relays steht oder du seinen Feed öffnest.',
    pl_PL:
      'Aktualizuje Jumble do 26.11.2, który dodaje panel boczny z podsumowaniem feedu i udostępnianie profili. Przekaźnik pod adresem lokalnym, na przykład kończącym się na .local, łączy się tylko wtedy, gdy jest na liście Read & Write Relays albo gdy otworzysz jego feed.',
    fr_FR:
      "Met à jour Jumble vers 26.11.2, qui ajoute un panneau latéral de résumé du fil et le partage de profils. Un relais à une adresse locale, par exemple se terminant par .local, ne se connecte que s'il figure dans vos Read & Write Relays ou si vous ouvrez son fil.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
