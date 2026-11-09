/**
 * ÉCO's equations, a quarter, in sfcr's notation (src/sfc/system.js). Rates given as annual inputs (rcb, piT, sl, sm,
 * tp) are divided by 4; every other rate is a quarter's. Nominal flows and stocks are in points of the starting
 * quarter's GDP (100); real quantities in the starting quarter's prices. Each block names the model it comes from
 * (src/book/), and docs/modele.md (§ 3, M2) says why.
 */
export const EQUATIONS = `
  # Labour: productivity, potential, employment (GROWTH 11.22 to 11.24); the imports, which take up the demand the
  # workers cannot serve when they grow scarce (OPEN, and H)
  pr ~ pr[-1] * (1 + gpr)
  yfe ~ pr * Lf * (1 - un)
  s ~ c + g + i + x
  mup ~ mu * (1 + mut * max(un / u[-1] - 1, 0))
  im ~ mup * (c + i + x) + mug * g
  muavg ~ im / s
  y ~ (1 - muavg - me) * s
  Nt ~ y / pr
  N ~ N[-1] + etan * (Nt - N[-1])
  u ~ 1 - N / Lf
  gap ~ y / yfe - 1

  # Wages and prices: a Phillips curve on expected inflation, a mark-up on the normal unit cost (DISINF, GROWTH)
  pi1 ~ pic[-1]
  pi2 ~ pi1[-1]
  pi3 ~ pi2[-1]
  pia ~ (pic[-1] + pi1[-1] + pi2[-1] + pi3[-1]) / 4
  pie ~ chi * ((1 + piT)^0.25 - 1) + (1 - chi) * pia
  gw ~ pie + gpr + phil * (un / u[-1] - 1) + wpush
  W ~ W[-1] * (1 + gw)
  pwb ~ pwb[-1] * (1 + piw)
  pm ~ xr * pwb * pmshock
  pew ~ pwb * eshock
  pe ~ xr * pew * (1 - shield)
  uc ~ (1 - muavg - me) * W / pr + muavg * pm + me * pe
  p ~ (1 + phi + mpush) * uc
  pc ~ p * (1 + tauc)
  pic ~ pc / pc[-1] - 1

  # Demand: the state's purchases, exports (OPEN), investment (GROWTH 11.6 to 11.11)
  g ~ gshare * yfe
  G ~ p * g
  yw ~ yw[-1] * (1 + gpr)
  x ~ xw * yw * xshock * (pm / p)^epsx
  X ~ p * x
  ucap ~ kappa * y / k[-1]
  rrl ~ (1 + rl) / (1 + pie) - 1
  gk ~ gk0 + gammau * (ucap[-1] - 1) - gammar * 4 * (rrl[-1] - rrl0) - conf * gammac
  k ~ k[-1] * (1 + gk)
  i ~ k - k[-1] + delta * k[-1]
  I ~ p * i

  # Households: income, consumption out of expected real income and real wealth, the less the dearer real credit is
  # (PCEX2), portfolio (PC, LP, GROWTH)
  YD ~ WB - TW + UB + PEN + TO - ORV + FDh + Fb + rm[-1] * M[-1] + rbar[-1] * BL[-1] - TK
  ydr ~ (YD - pie * pc[-1] * v[-1]) / pc
  yde ~ eps * ydr + (1 - eps) * ydr[-1] * (1 + gpr)
  c ~ (1 - lock) * (1 - conf) * ((alpha1 - iota * 4 * (rrl[-1] - rrl0)) * yde + alpha2 * v[-1])
  C ~ pc * c
  V ~ V[-1] + YD - C
  v ~ V / pc
  BL ~ V * (lb0 + lb1 * (rbl - rm))
  M ~ V - BL

  # Firms: sales, imports, energy, profits, dividends, loans (GROWTH 11.37 to 11.39, OPEN)
  S ~ p * s
  IM ~ pm * im
  E ~ xr * pew * me * s
  SUBE ~ shield * xr * pew * me * s
  Y ~ S - IM - E
  GDP ~ Y + TC
  WB ~ W * N
  FDin ~ fin * p * yfe
  F ~ S - IM - E + SUBE + SUB + FDin - WB - rl[-1] * L[-1]
  TF ~ tauf * F
  FD ~ psid * (F[-1] - TF[-1])
  FDw ~ fshare * FD
  FDh ~ FD - FDw
  FU ~ F - TF - FD
  L ~ L[-1] + I - FU

  # Banks: deposits, loans, reserves, bills as what is left (BMW, GROWTH 11.87 to 11.92)
  rb ~ rcb / 4
  rl ~ (rcb + sl) / 4
  rm ~ max(rcb - sm, 0) / 4
  Hb ~ rho * M
  Bb ~ M - L - Hb
  Fb ~ rl[-1] * L[-1] + rb[-1] * Bb[-1] - rm[-1] * M[-1]

  # The state: purchases, benefits, taxes, interest, bills and bonds (PC, LP)
  UB ~ rr * (1 - tauw) * W * (Lf - N)
  pen ~ pen[-1] * (1 + idx * pic[-1])
  PEN ~ pen * Ret
  TO ~ tos * p * yfe
  SUB ~ subs * p * yfe
  ORV ~ orv * p * y
  TW ~ tauw * WB
  TC ~ tauc * p * c
  TK ~ tauk * (FDh + Fb + rm[-1] * M[-1] + rbar[-1] * BL[-1])
  T ~ TW + TC + TF + TK
  rbl ~ (rcb + tp) / 4
  rbar ~ rbar[-1] + (rbl[-1] - rbar[-1]) / mat
  INT ~ rb[-1] * Bs[-1] + rbar[-1] * BL[-1] - Fcb
  SPEND ~ G + UB + PEN + TO + SUB + SUBE + INT
  DEF ~ SPEND - T - ORV
  Bs ~ Bs[-1] + DEF - (BL - BL[-1])
  DEBT ~ Bs + BL

  # The central bank: the policy rate, the bills left, the reserves of foreign currency (PC, OPEN)
  Fcb ~ rb[-1] * Bcb[-1]
  Bcb ~ Bs - Bb
  CA ~ X - IM - E - FDw + FDin
  or ~ or[-1] + CA / xr
  Hs ~ Hs[-1] + d(Bcb) + xr * d(or)
`;
