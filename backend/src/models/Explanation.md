## 🔐 **HIERARQUIA DE PAPÉIS E UTILIZADORES**

### 1. **ADMINISTRADOR, CONSULTOR, SERVICELINE_LIDER, TALENT_MANAGER**
```
UTILIZADOR (base)
    ↓
    ├─→ ADMINISTRADOR (gestão plataforma)
    ├─→ CONSULTOR (requer badges)
    ├─→ TALENT_MANAGER (valida candidaturas)
    └─→ SERVICELINE_LIDER (aprova candidaturas)
```

**Por quê?** Herança de papéis com table-per-type. Uma pessoa pode ter dados específicos do seu papel sem inflacionar a tabela UTILIZADOR.

**Funcionamento:**
- Um utilizador começa como CONSULTOR (default)
- Pode ser promovido a TALENT_MANAGER ou SERVICE_LINE_LEADER
- Cada papel tem tabela própria com campos específicos:
  - CONSULTOR: `AREAID` (que área pertence), LinkedIn, biografia
  - SERVICE_LINE_LEADER: `SERVICELINEID` (qual service line lidera)
  - TALENT_MANAGER: mínimo (apenas precisa de referência)
  - ADMINISTRADOR: mínimo (acesso irrestrito)

---

## 📋 **WORKFLOW DE CANDIDATURAS**

### 2. **ESTADO_CANDIDATURABADGE** - Estados do workflow
```
Estados possíveis:
OPEN → SUBMITTED → EM_VALIDACAO → FECHADO_APROVADO/FECHADO_REJEITADO
```

**Por quê?** Permite rastrear toda a progressão da candidatura e customizar estados por negócio.

**Funcionamento:**
```
Admin cria estados:
├─ Pending (esperando acção)
├─ In Review (TalentManager avaliando)
├─ Approved TM (passou TM)
├─ Awaiting SL (esperando Service Line Leader)
├─ Approved (SL aprovou)
└─ Rejected (foi rejeitada)
```

### 3. **CANDIDATURABADGE** - Candidatura de uma badge
A tabela central do workflow. Exemplo:

```
João (Consultor) quer a badge "AWS Solutions Architect"
├─ DATA_SUBMICAO: 2026-06-01
├─ ESTADOID: "In Review"
├─ TALENTMANAGERID: 5 (Maria validando)
├─ SERVICELINELEADERID: 3 (Pedro para aprovar depois)
├─ SLA_ID: 1 (SLA Standard = 5 dias)
├─ DATA_SLA_LIMITE: 2026-06-06
└─ SLA_EXCEDIDO: false (ainda em prazo)
```

**Fluxo:**
1. Consultor submete candidatura → estado "SUBMITTED"
2. TalentManager valida → `DATA_VALIDACAO`, `TALENTMANAGERID` preenchidos
3. Se ok, passa para ServiceLineLeader → estado muda
4. Se SL aprova → `DATA_APROVACAO`, badge entra em `CONSULTOR_BADGE`
5. Se algum rejeita → email com motivo, estado "REJECTED"

### 4. **SLA_CONFIG** - Gestão de prazos
```
SLA Standard:
├─ DIAS_RESPOSTA: 5 (TM tem 5 dias)
├─ DIAS_ALERTA_EXPIRACAO: 2 (aviso 2 dias antes)
└─ Sistema calcula DATA_SLA_LIMITE automaticamente
```

**Por quê?** Garantir prazos máximos. Se SLA_EXCEDIDO = true, o sistema:
- Envia alertas diários
- Prioriza na UI
- Relatórios de performance

### 5. **FEEDBACK_CANDIDATURA** - Comentários no workflow
Quando uma candidatura é rejeitada ou precisa de ajustes:
```
Rejeição:
├─ TIPO: "REJECTION"
├─ USERID: 5 (Maria que rejeitou)
├─ TEXTO: "Faltam provas. Submeta certificado oficial."
└─ Consultor vê e resubmete com docs corretas
```

### 6. **EVIDENCIA** - Prova/Documentação
```
Exemplo: Certificação AWS
├─ CANDIDATURAID: link à candidatura
├─ REQUISITONID: "Enviar certificado" (requisito específico)
├─ FILEPATH: "s3://bucket/aws-cert-2026.pdf"
├─ TAMANHO_BYTES: 245000
├─ TIPO_ARQUIVO: "PDF"
└─ UPLOADED_BY: João (Consultor)

Sistema permite:
✓ Múltiplos ficheiros por requisito
✓ Validação de tipo de ficheiro
✓ Scanning de malware
✓ Auditoria quem fez upload
```

---

## 🏆 **GAMIFICATION - BADGES CONQUISTADAS**

### 7. **CONSULTOR_BADGE** - Badges ganhas (histórico permanente)
Quando uma candidatura é APROVADA, cria-se registo aqui:

```
João conquistou "AWS Solutions Architect"
├─ CONSULTORID: João
├─ BADGEID: AWS Solutions Architect
├─ DATA_OBTENCAO: 2026-06-15 (quando aprovada)
├─ DATA_EXPIRACAO: 2027-06-15 (12 meses depois)
├─ DURACAO_MESES: 12 (cópia para histórico)
├─ VALIDO: true (false se expirou ou revogada)
├─ PONTOS_OBTIDOS: 50 (para ranking)
└─ Sistema recalcula RANKING_SNAPSHOT todo dia
```

**Por quê?** Histórico imutável. Mesmo que badge seja deletada da plataforma, o registo fica.

### 8. **CERTIFICADO_DOWNLOAD** - Tracking de downloads
```
Cada vez que João faz download do certificado:
├─ DOWNLOADED_AT: timestamp
├─ IP_ORIGEM: 192.168.1.100 (para compliance)
├─ USER_AGENT: Mozilla/5.0... (device tracking)
└─ FORMATO: PDF (futura suporte Excel?)

Para relatórios:
- Quantas vezes cada certificado foi descarregado
- Dispositivos mais usados
- Padrões de utilização (noite vs dia)
```

### 9. **BADGE_PREMIUM** - Badges de conquista especial
```
Sistema calcula automaticamente:

"Domínio Total em Cloud":
├─ Criterio: "10+ badges em 3 áreas diferentes"
├─ Criada por: Admin
├─ ICONE: ⭐⭐⭐
└─ Atribuída automaticamente quando critério é cumprido
```

### 10. **CONSULTOR_BADGEPREMIUM** - Badges premium conquistadas
```
Sistema detecta que João cumpre critério
├─ Cria registo em CONSULTOR_BADGEPREMIUM
├─ Envia notificação: "Parabéns! Conquistou 'Domínio Total em Cloud'!"
└─ Badge aparece no perfil com efeitos especiais
```

---

## 📢 **NOTIFICAÇÕES E COMUNICAÇÃO**

### 11. **NOTIFICACAO_CONFIG** - Configuração de tipos de notificação
Admin define que tipo de eventos geram notificações:

```
"Candidatura Submetida" (tipo)
├─ EMAIL_ENABLED: true (enviar por email)
├─ PUSH_ENABLED: true (push notification)
├─ SMS_ENABLED: false (SMS desativado)
├─ DAYS_BEFORE: null (imediato)
└─ TEMPLATE_ID: 5 (template de email)

"SLA Expirando" (tipo)
├─ EMAIL_ENABLED: true
├─ SMS_ENABLED: true
├─ DAYS_BEFORE: 2 (avisar 2 dias antes)
└─ Sistema corre job diário às 6h de manhã
```

### 12. **AVISOS** - Notificações para utilizadores
```
Quando algo acontece:
├─ USERID: 12 (Maria, TalentManager)
├─ TITULO: "Candidatura aguardando revisão"
├─ MENSAGEM: "João_Silva submeteu badge AWS"
├─ TIPO: "action_required"
├─ LIDA: false → true quando clica
├─ LIDA_EM: null → timestamp quando leu
├─ EMAIL_ENVIADO: true (email foi já enviado)
└─ PUSH_ENVIADO: false (ainda não teve app aberta)

Sistema:
✓ Mantém histórico completo
✓ Permite recuperar (não delete hard)
✓ Útil para relatórios de engagement
```

### 13. **INFORMACAO** - Comunicados gerais
```
Admin quer fazer comunicado:
├─ TITULO: "Manutenção do sistema"
├─ MENSAGEM: "Plataforma offline dia 20/06"
├─ TIPO: "maintenance"
├─ DATA_INICIO: 2026-06-20 10:00
├─ DATA_FIM: 2026-06-20 14:00
├─ ATIVO: true
└─ Aparece em banner/dashboard para todos

Diferente de AVISOS:
- AVISOS = notificações personalizadas por ação
- INFORMACAO = broadcasts para toda a gente
```

---

## 📊 **TRACKING E ANALYTICS**

### 14. **CONSULTOR_TIMELINE** - Metas e evolução profissional
```
Sistema permite definir objetivos:

"Completar 3 badges em Azure" (meta do consultor)
├─ CONSULTORID: João
├─ DATA_INICIO: 2026-06-01
├─ DATA_PREVISTA: 2026-12-31 (objetivo até final ano)
├─ DATA_CONCLUSAO: null (ainda em progresso)
├─ TIPO: "Meta"
├─ STATUS: "Em Progresso" (25% - tem 1/3)
├─ PRIORIDADE: 1 (alta)
└─ Sistema avalia progresso vs badges conquistadas

Dashboard mostra:
- Timeline de carreira
- Metas completadas vs prazo
- Recomendações automáticas
```

### 15. **RANKING_SNAPSHOT** - Histórico de desempenho
Snapshot diário do ranking (cálculo pesado):

```
2026-06-01 (período_data)
├─ CONSULTORID: João
├─ TOTAL_PONTOS: 250 (somado de CONSULTOR_BADGE.PONTOS_OBTIDOS)
├─ TOTAL_BADGES: 5
├─ POSICAO_GERAL: 42 (em 500 consultores)
├─ POSICAO_SERVICELINE: 8 (em 50 da sua SL)
└─ POSICAO_AREA: 3 (em 15 da sua área)

2026-06-02 (nova snapshot)
├─ TOTAL_PONTOS: 300 (conquistou nova badge)
├─ POSICAO_GERAL: 35 (subiu!)
└─ Sistema mostra trend: ↑ melhorando

Por quê snapshot diário?
✓ Queries rápidas no dashboard (não recalcula live)
✓ Histórico para análises (ver progresso mensal)
✓ Comparações período a período
```

---

## 🤝 **CONFORMIDADE E POLÍTICAS**

### 16. **POLITICARGPD** - Versioning de políticas
```
Versão 1.0 (antiga):
├─ DATA_INICIO_VIGENCIA: 2025-01-01
├─ DATA_FIM_VIGENCIA: 2026-05-31 (foi substituída)
└─ ATIVO: false (users não veem mais)

Versão 2.0 (atual):
├─ DATA_INICIO_VIGENCIA: 2026-06-01
├─ DATA_FIM_VIGENCIA: null (ainda ativa)
├─ OBRIGATORIA: true (tem que aceitar para usar plataforma)
└─ ATIVO: true

Sistema:
✓ Força aceitar nova política quando muda
✓ Guarda timestamp de quem aceitou quando
✓ Prova para RGPD/legal se necessário
```

### 17. **ACEITACAO_POLITICA_RGPD** - Auditoria de compliance
```
Quando João aceita política v2.0:
├─ POLITICAID: 2
├─ CONSULTORID: João
├─ DATA_ACEITACAO: 2026-06-01 14:32:15 (exato!)
├─ IP_ORIGEM: 192.168.1.100 (prova que aceitou de onde)
└─ USER_AGENT: Mozilla/5.0... (que device)

Legal pode pedir: "Prova que João aceitou política?"
Resposta: "Sim, 2026-06-01 IP 192.168.1.100"
Cumpliance ✓
```

---

## 🔗 **INTEGRAÇÃO E AUDITORIA**

### 18. **INTEGRACAO_EXTERNA** - Conectar com sistemas externos
```
João quer conectar badge do LinkedIn:

├─ USERID: João
├─ PLATAFORMA: "LinkedIn"
├─ USUARIO_EXTERNO_ID: "123456" (LinkedIn ID de João)
├─ WEBHOOK_URL: "https://...webhook" (LinkedIn notifica)
├─ ACCESS_TOKEN: "[encrypted]" (token seguro)
├─ ATIVO: true
└─ Sistema:
   ✓ Sincroniza badges do LinkedIn
   ✓ Se consegue certificado lá, pull automático
   ✓ Webhook notifica quando certificado novo
```

### 19. **EMAIL_ASSINATURA** - Assinatura de email com badge
```
João quer usar badge AWS na assinatura:

├─ CONSULTORID: João
├─ BADGEID: AWS Solutions Architect
├─ TEMPLATE_HTML: "<img src='badge.png'><p>Certificado 2026</p>"
├─ ATIVO: true
└─ Quando João envia email:
   ✓ Assinatura inclui badge
   ✓ Clientes veem que é certificado
   ✓ Link na badge vai para verificação pública
```

### 20. **LOGSWORKFLOW_CANDIDATURABADGE** - Auditoria completa
```
Cada transição no workflow:

12:30 - João submete candidatura AWS
├─ CANDIDATURAID: 542
├─ USERID: null (João, mas consultor normal)
├─ ANTIGO_ESTADOID: 1 (Open)
├─ NOVO_ESTADOID: 2 (Submitted)
└─ MOTIVO: null

14:15 - Maria (TM) valida
├─ USERID: 5 (Maria)
├─ ANTIGO_ESTADOID: 2 (Submitted)
├─ NOVO_ESTADOID: 3 (In Review)
└─ MOTIVO: null

16:00 - Maria rejeita
├─ USERID: 5 (Maria)
├─ ANTIGO_ESTADOID: 3 (In Review)
├─ NOVO_ESTADOID: 5 (Rejected)
└─ MOTIVO: "Falta certificado oficial"

Para:
✓ Auditoria: quem fez o quê e quando
✓ Relatórios: tempo médio por etapa
✓ Compliance: prova de processo
```

---

## 📝 **RESUMO - PORQUE TUDO ISTO?**

| Tabela | Problema que resolve | Funcionamento |
|--------|---------------------|---------------|
| **Hierarquia papéis** | Dados específicos sem inflacionar User | Cada papel tem tabela própria |
| **ESTADO + SLA** | Gestão de prazos + workflow flexível | Estados customizáveis, alertas automáticas |
| **CONSULTOR_BADGE** | Histórico imutável de conquistas | Snapshot ao aprovar candidatura |
| **RANKING_SNAPSHOT** | Queries rápidas + histórico | Calcula diário, não real-time |
| **POLITICA_RGPD** | Compliance + versioning | Força nova aceitação, guarda prova |
| **AVISOS** | Comunicações personalizadas rastreáveis | Multicanal (email, push, SMS) |
| **LOGS_WORKFLOW** | Auditoria completa | Cada mudança de estado fica registada |

Tudo isto permite que a plataforma seja **segura, escalável, auditável e compliant com regulações**.