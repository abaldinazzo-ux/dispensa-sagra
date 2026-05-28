function giorniDa(dataISO) {
  const oggi = new Date()
  oggi.setHours(0, 0, 0, 0)
  const data = new Date(dataISO)
  data.setHours(0, 0, 0, 0)
  return Math.floor((oggi - data) / (1000 * 60 * 60 * 24))
}

export default function BadgeScadenza({ dataPreparazione }) {
  const giorni = giorniDa(dataPreparazione)

  let label, classes
  if (giorni > 30) {
    label = `${giorni}gg`
    classes = 'bg-red-100 text-red-700 border border-red-300'
  } else if (giorni > 7) {
    label = `${giorni}gg`
    classes = 'bg-yellow-100 text-yellow-700 border border-yellow-300'
  } else {
    label = giorni === 0 ? 'Oggi' : `${giorni}gg`
    classes = 'bg-green-100 text-green-700 border border-green-300'
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${classes}`}>
      {label}
    </span>
  )
}
