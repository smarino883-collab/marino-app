import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Calendar as CalIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns'
import { it } from 'date-fns/locale'

const TIPO_COLORI = {
  assemblea: 'bg-purple-500',
  scadenza_rata: 'bg-red-500',
  manutenzione: 'bg-amber-500',
  altro: 'bg-teal-500',
}

const TIPO_LABEL = {
  assemblea: 'Assemblea',
  scadenza_rata: 'Scadenza rata',
  manutenzione: 'Manutenzione',
  altro: 'Altro',
}

export default function Calendario() {
  const { condominio } = useAuth()
  const [eventi, setEventi] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (condominio) load()
  }, [condominio, currentMonth])

  async function load() {
    setLoading(true)
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const { data } = await supabase
      .from('eventi')
      .select('*')
      .eq('condominio_id', condominio.id)
      .gte('data_inizio', start.toISOString())
      .lte('data_inizio', end.toISOString())
      .order('data_inizio')
    setEventi(data || [])
    setLoading(false)
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  // Padding per allineare al lunedì
  const startPad = (startOfMonth(currentMonth).getDay() + 6) % 7
  const padDays = Array(startPad).fill(null)

  const eventiDelGiorno = selectedDay
    ? eventi.filter((e) => isSameDay(new Date(e.data_inizio), selectedDay))
    : []

  const prossimi = eventi
    .filter((e) => new Date(e.data_inizio) >= new Date())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Calendario</h1>

      {/* Navigazione mese */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-lg">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-semibold capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: it })}
          </h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-lg">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400 mb-2">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {padDays.map((_, i) => <div key={`pad-${i}`} />)}
          {days.map((day) => {
            const dayEventi = eventi.filter((e) => isSameDay(new Date(e.data_inizio), day))
            const selected = selectedDay && isSameDay(day, selectedDay)
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`relative aspect-square rounded-lg text-sm flex flex-col items-center justify-center transition ${
                  selected ? 'bg-teal-600 text-white' :
                  isToday(day) ? 'bg-teal-50 text-teal-700 font-semibold' :
                  'hover:bg-slate-50'
                }`}
              >
                {format(day, 'd')}
                {dayEventi.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEventi.slice(0, 3).map((e, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-white' : TIPO_COLORI[e.tipo] || 'bg-teal-500'}`} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Eventi del giorno selezionato */}
      {selectedDay && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase mb-3">
            {format(selectedDay, "d MMMM yyyy", { locale: it })}
          </h2>
          {eventiDelGiorno.length === 0 ? (
            <div className="bg-white rounded-xl p-4 text-center text-slate-400 text-sm">Nessun evento</div>
          ) : (
            <div className="space-y-2">
              {eventiDelGiorno.map((e) => (
                <div key={e.id} className="bg-white rounded-xl p-4 border border-slate-100 flex gap-3">
                  <div className={`w-1 rounded-full ${TIPO_COLORI[e.tipo] || 'bg-teal-500'}`} />
                  <div>
                    <h3 className="font-medium">{e.titolo}</h3>
                    <p className="text-xs text-slate-500 capitalize">{TIPO_LABEL[e.tipo]} · {format(new Date(e.data_inizio), 'HH:mm')}</p>
                    {e.descrizione && <p className="text-sm text-slate-600 mt-1">{e.descrizione}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Prossimi eventi */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase mb-3 flex items-center gap-2">
          <CalIcon size={14} /> Prossimi appuntamenti
        </h2>
        {loading ? (
          <div className="text-center py-4 text-slate-400">Caricamento...</div>
        ) : prossimi.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-slate-400 text-sm">Nessun evento in programma</div>
        ) : (
          <div className="space-y-2">
            {prossimi.map((e) => (
              <div key={e.id} className="bg-white rounded-xl p-4 border border-slate-100 flex gap-4">
                <div className="text-center shrink-0 w-12">
                  <div className="text-xs text-teal-600 font-medium uppercase">{format(new Date(e.data_inizio), 'MMM', { locale: it })}</div>
                  <div className="text-xl font-bold">{format(new Date(e.data_inizio), 'd')}</div>
                </div>
                <div>
                  <h3 className="font-medium">{e.titolo}</h3>
                  <p className="text-xs text-slate-500 capitalize">{TIPO_LABEL[e.tipo]}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
