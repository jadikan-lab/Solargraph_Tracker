import React from 'react'
import { ScreenTitle, StatusHero, Card, Chip, Btn, IconArrowR, IconPlus, IconEdit } from '../ui.jsx'

function ListEditor({ title, items }) {
  return (
    <Card flat>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 8px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>{title}</div>
        <button style={{ width: 30, height: 30, borderRadius: 999, border: '1px solid var(--papier-edge)', background: 'var(--papier-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconPlus size={14}/></button>
      </div>
      <div style={{ padding: '0 14px 14px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((it, i) => <Chip key={i} icon={<IconEdit size={11}/>}>{it}</Chip>)}
      </div>
    </Card>
  )
}

export default function Reglages() {
  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ScreenTitle sub="listes & sync">Réglages</ScreenTitle>
      <StatusHero state="ok"/>
      <ListEditor title="Boîtes" items={['Café 250g', 'Conserve', 'Alu', 'Boîte film']}/>
      <ListEditor title="Diamètres" items={['0.2 mm', '0.26 mm', '0.3 mm', '0.4 mm', '0.5 mm']}/>
      <ListEditor title="Papiers" items={['Ilford MGIV', 'Foma 132']}/>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>Corbeille (14 j)</div>
            <div style={{ fontSize: 12.5, color: 'var(--encre-mute)' }}>0 élément restaurable</div>
          </div>
          <Btn kind="paper" size="sm" iconRight={<IconArrowR size={14}/>}>ouvrir</Btn>
        </div>
      </Card>
    </div>
  )
}
