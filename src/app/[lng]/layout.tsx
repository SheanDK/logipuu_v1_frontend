// src/app/[lng]/layout.tsx
import React from 'react';
import { dir } from 'i18next';

type Props = {
  children: React.ReactNode;
  params: Promise<Readonly<{ lng: string }>>;
};

export default async function LangLayout({ children, params }: Props) {
  const { lng } = await params;
  return <div dir={dir(lng)}>{children}</div>;
}
