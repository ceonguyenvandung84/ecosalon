"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, AreaChart, Area, CartesianGrid } from "recharts";

export interface ChartDatum {
  name: string;
  value?: number;
  revenue?: number;
  orders?: number;
  // [key: string]: number | string | undefined;
}

export function SignupsChart({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data ?? []} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
        <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
        <Tooltip wrapperStyle={{ fontSize: 11 }} />
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="value" name="Đăng ký" stroke="#4CAF50" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data ?? []} margin={{ top: 10, right: 20, left: -10, bottom: 40 }}>
        <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={60} interval={0} />
        <YAxis tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
        <Tooltip wrapperStyle={{ fontSize: 11 }} />
        <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="value" name="Khóa học" fill="#4CAF50" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const fmtCompact = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}tr`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return `${v}`;
};

export function RevenueAreaChart({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data ?? []} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" vertical={false} />
        <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tickLine={false} tick={{ fontSize: 10 }} tickFormatter={fmtCompact} width={44} />
        <Tooltip wrapperStyle={{ fontSize: 11 }} formatter={(v: number | string) => new Intl.NumberFormat("vi-VN").format(Number(v)) + "đ"} />
        <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#4CAF50" strokeWidth={2} fill="url(#revGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OrdersLineChart({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data ?? []} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2ee" vertical={false} />
        <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
        <Tooltip wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="orders" name="Số đơn" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function HBarChart({
  data,
  dataKey = "value",
  name = "Giá trị",
  color = "#4CAF50",
}: {
  data: ChartDatum[];
  dataKey?: string;
  name?: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data ?? []} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <XAxis type="number" tickLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tickLine={false} tick={{ fontSize: 10 }} width={130} interval={0} />
        <Tooltip wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey={dataKey} name={name} fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}