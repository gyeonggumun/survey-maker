import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface ResultChartProps {
  data: Array<{ label: string; count: number }>
}

export default function ResultChart({ data }: ResultChartProps) {
  return (
    <div className="h-64 w-full" aria-label="선택지별 응답 수 차트">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip cursor={{ fill: '#eef2ff' }} />
          <Bar dataKey="count" name="응답 수" fill="#4f46e5" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
