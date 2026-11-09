# The reference trajectories of the book's models (Godley and Lavoie, 2007, ch. 3 to 9), solved by sfcr
# (Macalós, MIT), kept as CSV in tests/fixtures/sfcr/ for tests/reference.test.js. Run once, from the repository:
#   Rscript scripts/reference/sfcr.R
# The equations are the book's, in sfcr's notation; sfcr solves each period's simultaneity by its own iteration, an
# independent check on the explicit order of src/. Its period 1 is the start (zero, or the baseline's stationary
# state for a scenario): our period t is its period t + 1.

lib <- file.path(Sys.getenv("LOCALAPPDATA"), "R", "library")
if (dir.exists(lib)) .libPaths(c(lib, .libPaths()))
suppressPackageStartupMessages(library(sfcr))

out <- file.path("tests", "fixtures", "sfcr")
dir.create(out, showWarnings = FALSE, recursive = TRUE)
stamp <- sprintf("# sfcr %s, %s, written by scripts/reference/sfcr.R", packageVersion("sfcr"), R.version.string)
periods <- 60

save <- function(run, name, columns) {
  path <- file.path(out, paste0(name, ".csv"))
  table <- as.data.frame(run)[, c("period", columns)]
  writeLines(stamp, path)
  suppressWarnings(write.table(format(table, digits = 15), path, sep = ",", row.names = FALSE, quote = FALSE, append = TRUE))
  cat(name, nrow(table), "rows\n")
}

sim_eqs <- sfcr_set(
  TX ~ theta * W * N,
  YD ~ W * N - TX,
  C ~ alpha1 * YD + alpha2 * Hh[-1],
  Hs ~ Hs[-1] + G - TX,
  Hh ~ Hh[-1] + YD - C,
  Y ~ C + G,
  N ~ Y / W
)
simex_eqs <- sfcr_set(
  TX ~ theta * W * N,
  YD ~ W * N - TX,
  YDE ~ YD[-1],
  C ~ alpha1 * YDE + alpha2 * Hh[-1],
  Hs ~ Hs[-1] + G - TX,
  Hh ~ Hh[-1] + YD - C,
  Hd ~ Hh[-1] + YDE - C,
  Y ~ C + G,
  N ~ Y / W
)
sim_ext <- sfcr_set(G ~ 20, W ~ 1, alpha1 ~ 0.6, alpha2 ~ 0.4, theta ~ 0.2)

pc_eqs <- sfcr_set(
  Y ~ C + G,
  YD ~ Y - TX + r[-1] * Bh[-1],
  TX ~ theta * (Y + r[-1] * Bh[-1]),
  V ~ V[-1] + (YD - C),
  C ~ alpha1 * YD + alpha2 * V[-1],
  Hh ~ V - Bh,
  Bh ~ V * (lambda0 + lambda1 * r) - lambda2 * YD,
  Bs ~ Bs[-1] + (G + r[-1] * Bs[-1]) - (TX + r[-1] * Bcb[-1]),
  Hs ~ Hs[-1] + Bcb - Bcb[-1],
  Bcb ~ Bs - Bh,
  r ~ r_bar
)
pcex_eqs <- sfcr_set(
  Y ~ C + G,
  YD ~ Y - TX + r[-1] * Bh[-1],
  TX ~ theta * (Y + r[-1] * Bh[-1]),
  V ~ V[-1] + (YD - C),
  C ~ alpha1 * YDE + alpha2 * V[-1],
  YDE ~ YD[-1],
  Ve ~ V[-1] + (YDE - C),
  Bd ~ Ve * (lambda0 + lambda1 * r) - lambda2 * YDE,
  Hd ~ Ve - Bd,
  Bh ~ Bd,
  Hh ~ V - Bh,
  Bs ~ Bs[-1] + (G + r[-1] * Bs[-1]) - (TX + r[-1] * Bcb[-1]),
  Hs ~ Hs[-1] + Bcb - Bcb[-1],
  Bcb ~ Bs - Bh,
  r ~ r_bar
)
pc_ext <- sfcr_set(r_bar ~ 0.025, G ~ 20, alpha1 ~ 0.6, alpha2 ~ 0.4, theta ~ 0.2, lambda0 ~ 0.635, lambda1 ~ 5, lambda2 ~ 0.01)

sim_cols <- c("Y", "TX", "YD", "C", "Hh", "Hs")
pc_cols <- c("Y", "TX", "YD", "C", "V", "Hh", "Bh", "Bs", "Bcb", "Hs")
solve <- function(eqs, ext, hidden, length = periods) sfcr_baseline(eqs, ext, periods = length, hidden = hidden, method = "Gauss", tol = 1e-15, max_iter = 1000)
# A scenario from the last period of a baseline long enough to have settled (1000 periods), the shock from sfcr's period 5 on (our period 4).
shock <- function(base, change) sfcr_scenario(base, sfcr_shock(variables = change, start = 5, end = periods), periods = periods, method = "Gauss", tol = 1e-15, max_iter = 1000)

sim <- solve(sim_eqs, sim_ext, c("Hh" = "Hs"))
save(sim, "sim-zero", sim_cols)
save(shock(solve(sim_eqs, sim_ext, c("Hh" = "Hs"), 1000), sfcr_set(G ~ 25)), "sim-g25", sim_cols)
simex <- solve(simex_eqs, sim_ext, c("Hh" = "Hs"))
save(simex, "simex-zero", c(sim_cols, "YDE", "Hd"))
save(shock(solve(simex_eqs, sim_ext, c("Hh" = "Hs"), 1000), sfcr_set(alpha1 ~ 0.7)), "simex-alpha1", c(sim_cols, "YDE", "Hd"))
pc <- solve(pc_eqs, pc_ext, c("Hh" = "Hs"))
save(pc, "pc-zero", pc_cols)
save(shock(solve(pc_eqs, pc_ext, c("Hh" = "Hs"), 1000), sfcr_set(r_bar ~ 0.035)), "pc-r35", pc_cols)
pcex <- solve(pcex_eqs, pc_ext, c("Hh" = "Hs"))
save(pcex, "pcex-zero", c(pc_cols, "YDE", "Ve", "Hd"))
save(shock(solve(pcex_eqs, pc_ext, c("Hh" = "Hs"), 1000), sfcr_set(r_bar ~ 0.035)), "pcex-r35", c(pc_cols, "YDE", "Ve", "Hd"))

# The book's blocks of ÉCO (src/book/), their equations as sfcr's vignettes write them (DISINF's interest corrected,
# see src/book/disinf.js). Each from its vignette's start, for its vignette's periods; then a scenario of 60 periods
# from that last period, the shock from its period 5. A scenario's rows are numbered from the baseline's start, so
# that our run from the start, one period less, retraces both: its row k is period P - 1 + k.
everything <- function(run) setdiff(names(as.data.frame(run)), c("period", grep("^block", names(as.data.frame(run)), value = TRUE)))
book <- function(name, eqs, ext, length, change, initial = NULL, hidden = NULL, columns = NULL, rhtol = FALSE) {
  base <- sfcr_baseline(eqs, ext, periods = length, initial = initial, hidden = hidden, method = "Gauss", tol = 1e-15, max_iter = 1000, .hidden_tol = 1e-6, rhtol = rhtol)
  if (is.null(columns)) columns <- everything(base)
  save(base, paste0(name, "-zero"), columns)
  run <- sfcr_scenario(base, sfcr_shock(variables = change, start = 5, end = periods), periods = periods, method = "Gauss", tol = 1e-15, max_iter = 1000)
  run <- as.data.frame(run)[-1, ]
  run$period <- length - 1 + seq_len(nrow(run)) + 1
  save(run, paste0(name, "-shock"), columns)
}

lp_eqs <- sfcr_set(
  Y ~ C + G,
  YDr ~ Y - TX + rb[-1] * Bh[-1] + BLh[-1],
  TX ~ theta * (Y + rb[-1] * Bh[-1] + BLh[-1]),
  V ~ V[-1] + (YDr - C) + CG,
  CG ~ (pbl - pbl[-1]) * BLh[-1],
  C ~ alpha1 * YDEr + alpha2 * V[-1],
  VE ~ V[-1] + (YDEr - C) + CG,
  Hh ~ V - Bh - pbl * BLh,
  Hd ~ VE - Bd - pbl * BLd,
  Bd ~ (VE * lambda20) + VE * (lambda22 * rb + lambda23 * ERrbl) + lambda24 * (YDEr),
  BLd ~ VE * (lambda30 + lambda32 * rb + lambda33 * ERrbl + lambda34 * (YDEr/VE))/pbl,
  Bh ~ Bd,
  BLh ~ BLd,
  Bs ~ Bs[-1] + (G + rb[-1] * Bs[-1] + BLs[-1]) - (TX + rb[-1] * Bcb[-1]) - (d(BLs) * pbl),
  Hs ~ Hs[-1] + d(Bcb),
  Bcb ~ Bs - Bh,
  BLs ~ BLh,
  ERrbl ~ rbl + chi * ((pebl - pbl)/pbl),
  rbl ~ 1/pbl,
  pebl ~ pbl,
  CGE ~ chi * (pebl - pbl) * BLh,
  YDEr ~ YDr[-1]
)
lp_ext <- sfcr_set(G ~ 20, rb ~ 0.03, pbl ~ 20, theta ~ 0.1938, alpha1 ~ 0.8, alpha2 ~ 0.2, lambda20 ~ 0.44196,
  lambda22 ~ 1.1, lambda23 ~ -1, lambda24 ~ -0.03, lambda30 ~ .3997, lambda32 ~ -1, lambda33 ~ 1.1, lambda34 ~ -0.03, chi ~ 0.1)
book("lp", lp_eqs, lp_ext, 100, sfcr_set(rb ~ 0.04, pbl ~ 15), hidden = c("Hs" = "Hh"))

bmw_eqs <- sfcr_set(
  Cs ~ Cd,
  Is ~ Id,
  Ns ~ Nd,
  Ls ~ Ls[-1] + Ld - Ld[-1],
  Y ~ Cs + Is,
  WBd ~ Y - rl[-1] * Ld[-1] - AF,
  AF ~ delta * K[-1],
  Ld ~ Ld[-1] + Id - AF,
  YD ~ WBs + rm[-1] * Mh[-1],
  Mh ~ Mh[-1] + YD - Cd,
  Ms ~ Ms[-1] + Ls - Ls[-1],
  rm ~ rl,
  WBs ~ W * Ns,
  Nd ~ Y / pr,
  W ~ WBd / Nd,
  Cd ~ alpha0 + alpha1 * YD + alpha2 * Mh[-1],
  K ~ K[-1] + Id - DA,
  DA ~ delta * K[-1],
  KT ~ kappa * Y[-1],
  Id ~ gamma * (KT - K[-1]) + DA
)
bmw_ext <- sfcr_set(rl ~ 0.025, alpha0 ~ 20, alpha1 ~ 0.75, alpha2 ~ 0.10, delta ~ 0.10, gamma ~ 0.15, kappa ~ 1, pr ~ 1)
book("bmw", bmw_eqs, bmw_ext, 100, sfcr_set(alpha0 ~ 30), hidden = c("Ms" = "Mh"))

disinf_eqs <- sfcr_set(
  y ~ s_E + inv_E - inv[-1],
  inv_T ~ sigma_T * s_E,
  inv_E ~ inv[-1] + gamma * (inv_T - inv[-1]),
  inv ~ inv[-1] + (y - s),
  s_E ~ beta * s[-1] + (1 - beta) * s_E[-1],
  s ~ c,
  N ~ y / pr,
  WB ~ N * W,
  UC ~ WB / y,
  INV ~ inv * UC,
  S ~ p * s,
  p ~ (1 + phi) * (1 + rrc * sigma_T) * UC,
  EF ~ S - WB + (INV - INV[-1]) - rl[-1] * INV[-1],
  Ld ~ INV,
  Ls ~ Ld,
  Ms ~ Ls,
  rm ~ rl - add,
  EFb ~ rl[-1] * Ls[-1] - rm[-1] * Mh[-1],
  pic ~ (UC / UC[-1]) - 1,
  rl ~ (1 + rrc) * (1 + pic) - 1,
  YD ~ WB + EF + EFb + rm[-1] * Mh[-1],
  Mh ~ Mh[-1] + YD - C,
  ydhs ~ c + (mh - mh[-1]),
  yd ~ YD / p,
  C ~ c * p,
  mh ~ Mh / p,
  c ~ alpha0 + alpha1 * ydhs_E + alpha2 * mh[-1],
  ydhs_E ~ epsilon * ydhs[-1] + (1 - epsilon) * ydhs_E[-1],
  omega_T ~ Omega0 + Omega1 * pr + Omega2 * (N / Nfe),
  W ~ W[-1] * (1 + Omega3 * (omega_T[-1] - (W[-1]/p[-1]))),
  yfe ~ (1 + sigma_T) * s - inv[-1],
  Nfe ~ s / pr
)
disinf_ext <- sfcr_set(rrc ~ 0.025, pr ~ 1, add ~ 0.02, alpha0 ~ 15, alpha1 ~ 0.8, alpha2 ~ 0.1, beta ~ 0.9,
  epsilon ~ 0.8, gamma ~ 0.25, phi ~ 0.24, sigma_T ~ 0.2, Omega0 ~ -1.4, Omega1 ~ 1, Omega2 ~ 1.2, Omega3 ~ 0.3)
book("disinf", disinf_eqs, disinf_ext, 200, sfcr_set(phi ~ 0.3), initial = sfcr_set(p ~ 1, W ~ 1, UC ~ 1), hidden = c("Mh" = "Ms"))

open_eqs <- sfcr_set(
  Y_N ~ C_N + G_N + X_N - IM_N,
  Y_S ~ C_S + G_S + X_S - IM_S,
  IM_N ~ mu_N * Y_N,
  IM_S ~ mu_S * Y_S,
  X_N ~ IM_S / xr,
  X_S ~ IM_N * xr,
  YD_N ~ Y_N - TX_N + r_N[-1] * Bh_N[-1],
  YD_S ~ Y_S - TX_S + r_S[-1] * Bh_S[-1],
  TX_N ~ theta_N * ( Y_N + r_N[-1] * Bh_N[-1] ),
  TX_S ~ theta_S * ( Y_S + r_S[-1] * Bh_S[-1] ),
  V_N ~ V_N[-1] + ( YD_N - C_N ),
  V_S ~ V_S[-1] + ( YD_S - C_S ),
  C_N ~ alpha1_N * YD_N + alpha2_N * V_N[-1],
  C_S ~ alpha1_S * YD_S + alpha2_S * V_S[-1],
  Hh_N ~ V_N - Bh_N,
  Hh_S ~ V_S - Bh_S,
  Bh_N ~ V_N * ( lambda0_N + lambda1_N * r_N - lambda2_N * ( YD_N/V_N ) ),
  Bh_S ~ V_S * ( lambda0_S + lambda1_S * r_S - lambda2_S * ( YD_S/V_S ) ),
  Bs_N ~ Bs_N[-1] + ( G_N + r_N[-1] * Bs_N[-1] ) - ( TX_N + r_N[-1] * Bcb_N[-1] ),
  Bs_S ~ Bs_S[-1] + ( G_S + r_S[-1] * Bs_S[-1] ) - ( TX_S + r_S[-1] * Bcb_S[-1] ),
  Bcb_N ~ Bs_N - Bh_N,
  Bcb_S ~ Bs_S - Bh_S,
  or_N ~ or_N[-1] + (( Hs_N - Hs_N[-1] - ( Bcb_N - Bcb_N[-1] ) )/pg_N),
  or_S ~ or_S[-1] + (( Hs_S - Hs_S[-1] - ( Bcb_S - Bcb_S[-1] ) )/pg_S),
  Hs_N ~ Hh_N,
  Hs_S ~ Hh_S,
  pg_S ~ pg_N * xr,
  deltaor_S ~ or_S - or_S[-1],
  deltaor_N ~ - (or_N - or_N[-1])
)
open_ext <- sfcr_set(xr ~ 1, pg_N ~ 1, r_N ~ 0.025, r_S ~ 0.025, G_S ~ 20, G_N ~ 20, mu_N ~ 0.15, mu_S ~ 0.15,
  alpha1_N ~ 0.7, alpha1_S ~ 0.8, alpha2_N ~ 0.3, alpha2_S ~ 0.2, lambda0_N ~ 0.67, lambda0_S ~ 0.67, lambda1_N ~ 0.05,
  lambda1_S ~ 0.05, lambda2_N ~ 0.01, lambda2_S ~ 0.01, theta_N ~ 0.2, theta_S ~ 0.2)
book("open", open_eqs, open_ext, 100, sfcr_set(mu_S ~ 0.25), hidden = c("deltaor_S" = "deltaor_N"))

# GROWTH (ch. 11), the vignette's equations, parameters and initial values, but for the households' wealth V and Vfma,
# as their parts add up (src/book/growth-values.js). 100 periods of its growth path, then the target real wage up.
growth_eqs <- sfcr_set(
  Yk ~ Ske + INke - INk[-1],
  Ske ~ beta*Sk + (1-beta)*Sk[-1]*(1 + (GRpr + RA)),
  INke ~ INk[-1] + gamma*(INkt - INk[-1]),
  INkt ~ sigmat*Ske,
  INk ~ INk[-1] + Yk - Sk - NPL/UC,
  Kk ~ Kk[-1]*(1 + GRk),
  GRk ~ gamma0 + gammau*U[-1] - gammar*RRl,
  U ~ Yk/Kk[-1],
  RRl ~ ((1 + Rl)/(1 + PI)) - 1,
  PI ~ (P - P[-1])/P[-1],
  Ik ~ (Kk - Kk[-1]) + delta * Kk[-1],
  Sk ~ Ck + Gk + Ik,
  S ~ Sk*P,
  IN ~ INk*UC,
  INV ~ Ik*P,
  K ~ Kk*P,
  Y ~ Sk*P + (INk - INk[-1])*UC,
  omegat ~ exp(omega0 + omega1*log(PR) + omega2*log(ER + z3*(1 - ER) - z4*BANDt + z5*BANDb)),
  ER ~ N[-1]/Nfe[-1],
  z3a ~ if (ER > (1-BANDb)) {1} else {0},
  z3b ~ if (ER <= (1+BANDt)) {1} else {0},
  z3 ~  z3a * z3b,
  z4 ~ if (ER > (1+BANDt)) {1} else {0},
  z5 ~ if (ER < (1-BANDb)) {1} else {0},
  W ~ W[-1] + omega3*(omegat*P[-1] - W[-1]),
  PR ~ PR[-1]*(1 + GRpr),
  Nt ~ Yk/PR,
  N ~ N[-1] + etan*(Nt - N[-1]),
  WB ~ N*W,
  UC ~ WB/Yk,
  NUC ~ W/PR,
  NHUC ~ (1 - sigman)*NUC + sigman*(1 + Rln[-1])*NUC[-1],
  P ~ (1 + phi)*NHUC,
  phi ~ phi[-1] + eps2*(phit[-1] - phi[-1]),
  phit ~ (FUft + FDf + Rl[-1]*(Lfd[-1] - IN[-1])) / ((1 - sigmase)*Ske*UC + (1 + Rl[-1])*sigmase*Ske*UC[-1]),
  HCe ~ (1 - sigmase)*Ske*UC + (1 + Rl[-1])*sigmase*Ske*UC[-1],
  sigmase ~ INk[-1]/Ske,
  Fft ~ FUft + FDf + Rl[-1]*(Lfd[-1] - IN[-1]),
  FUft ~ psiu*INV[-1],
  FDf ~ psid*Ff[-1],
  Ff ~ S - WB + (IN - IN[-1]) - Rl[-1]*IN[-1],
  FUf ~ Ff - FDf - Rl[-1]*(Lfd[-1] - IN[-1]) + Rl[-1]*NPL,
  Lfd ~ Lfd[-1] + INV + (IN - IN[-1]) - FUf - (Eks - Eks[-1])*Pe - NPL,
  NPL ~ NPLk * Lfs[-1],
  Eks ~ Eks[-1] + ((1 - psiu)*INV[-1])/Pe,
  Rk ~ FDf/(Pe[-1] * Ekd[-1]),
  PE ~ Pe/(Ff/Eks[-1]),
  Q ~ (Eks*Pe + Lfd)/(K + IN),
  YP ~ WB + FDf + FDb + Rm[-1]*Mh[-1] + Rb[-1]*Bhd[-1] + BLs[-1],
  TX ~ theta*YP,
  YDr ~ YP - TX - Rl[-1]*Lhd[-1],
  YDhs ~ YDr + CG,
  CG ~ (Pbl - Pbl[-1])*BLd[-1] + (Pe - Pe[-1])*Ekd[-1] + (OFb - OFb[-1]),
  V ~ V[-1] + YDr - CONS + (Pbl - Pbl[-1])*BLd[-1] + (Pe - Pe[-1])*Ekd[-1] + (OFb - OFb[-1]),
  Vk ~ V/P,
  CONS ~ Ck*P,
  Ck ~ alpha1*(YDkre + NLk) + alpha2*Vk[-1],
  YDkre ~ eps*YDkr + (1 - eps)*(YDkr[-1]*(1 + GRpr)),
  YDkr ~ YDr/P - ((P - P[-1]) * Vk[-1])/P,
  GL ~ eta*YDr,
  eta ~ eta0 - etar*RRl,
  NL ~ GL - REP,
  REP ~ deltarep*Lhd[-1],
  Lhd ~ Lhd[-1] + GL - REP,
  NLk ~ NL/P,
  BUR ~ (REP + Rl[-1] * Lhd[-1]) / YDr[-1],
  Bhd ~ Vfma[-1]*(lambda20 + lambda22*Rb[-1] - lambda21*Rm[-1] - lambda24*Rk[-1] - lambda23*Rbl[-1] - lambda25*(YDr/V)),
  BLd ~ Vfma[-1]*(lambda30 - lambda32*Rb[-1] - lambda31*Rm[-1] - lambda34*Rk[-1] + lambda33*Rbl[-1] - lambda35*(YDr/V))/Pbl,
  Pe ~ Vfma[-1]*(lambda40 - lambda42*Rb[-1] - lambda41*Rm[-1] + lambda44*Rk[-1] - lambda43*Rbl[-1] - lambda45*(YDr/V))/Ekd,
  Mh ~ Vfma - Bhd - Pe*Ekd - Pbl*BLd + Lhd,
  Vfma ~ V - Hhd - OFb,
  VfmaA ~ Mh + Bhd + Pbl * BLd + Pe * Ekd,
  Hhd ~ lambdac*CONS,
  Ekd ~ Eks,
  G ~ Gk*P,
  Gk ~ Gk[-1]*(1 + GRg),
  PSBR ~ G + BLs[-1] + Rb[-1]*(Bbs[-1] + Bhs[-1]) - TX,
  Bs ~ Bs[-1] + G - TX - (BLs - BLs[-1])*Pbl + Rb[-1]*(Bhs[-1] + Bbs[-1]) + BLs[-1],
  GD ~ Bbs + Bhs + BLs*Pbl + Hs,
  Fcb ~ Rb[-1]*Bcbd[-1],
  BLs ~ BLd,
  Bhs ~ Bhd,
  Hhs ~ Hhd,
  Hbs ~ Hbd,
  Hs ~ Hbs + Hhs,
  Bcbd ~ Hs,
  Bcbs ~ Bcbd,
  Rb ~ Rbbar,
  Rbl ~ Rb + ADDbl,
  Pbl ~ 1/Rbl,
  Ms ~ Mh,
  Lfs ~ Lfd,
  Lhs ~ Lhd,
  Hbd ~ ro*Ms,
  Bbs ~ Bbs[-1] + (Bs - Bs[-1]) - (Bhs - Bhs[-1]) - (Bcbs - Bcbs[-1]),
  Bbd ~ Ms + OFb - Lfs - Lhs - Hbd, 
  BLR ~ Bbd/Ms,
  Rm ~ Rm[-1] + z1a*xim1 + z1b*xim2 - z2a*xim1 - z2b*xim2,
  z2a ~ if (BLR[-1] > (top + .05)) {1} else {0},
  z2b ~ if (BLR[-1] > top) {1} else {0},
  z1a ~ if (BLR[-1] <= bot) {1} else {0},
  z1b ~ if (BLR[-1] <= (bot -.05)) {1} else {0},
  Rl ~ Rm + ADDl,
  OFbt ~ NCAR*(Lfs[-1] + Lhs[-1]),
  OFbe ~ OFb[-1] + betab*(OFbt - OFb[-1]),
  FUbt ~ OFbe - OFb[-1] + NPLke*Lfs[-1],
  NPLke ~ epsb*NPLke[-1] + (1 - epsb)*NPLk[-1],
  FDb ~ Fb - FUb,
  Fbt ~ lambdab*Y[-1] + (OFbe - OFb[-1] + NPLke*Lfs[-1]),
  Fb ~ Rl[-1]*(Lfs[-1] + Lhs[-1] - NPL) + Rb[-1]*Bbd[-1] - Rm[-1]*Ms[-1],
  ADDl ~ (Fbt - Rb[-1]*Bbd[-1] + Rm[-1]*(Ms[-1] - (1 - NPLke)*Lfs[-1] - Lhs[-1]))/((1 - NPLke)*Lfs[-1] + Lhs[-1]),
  FUb ~ Fb - lambdab*Y[-1],
  OFb ~ OFb[-1] + FUb - NPL,
  CAR ~ OFb/(Lfs + Lhs),
  Vf ~ IN + K - Lfd - Ekd * Pe,
  Ls ~ Lfs + Lhs
  )
growth_parameters = sfcr_set(
  alpha1 ~ 0.75,
  alpha2 ~ 0.064,
  beta ~ 0.5,
  betab ~ 0.4,
  gamma ~ 0.15,
  gamma0 ~ 0.00122,
  gammar ~ 0.1,
  gammau ~ 0.05,
  delta ~ 0.10667,
  deltarep ~ 0.1,
  eps ~ 0.5,
  eps2 ~ 0.8,
  epsb ~ 0.25,
  epsrb ~ 0.9,
  eta0 ~ 0.07416,
  etan ~ 0.6,
  etar ~ 0.4,
  theta ~ 0.22844,
  lambda20 ~ 0.25,
  lambda21 ~ 2.2,
  lambda22 ~ 6.6,
  lambda23 ~ 2.2,
  lambda24 ~ 2.2,
  lambda25 ~ 0.1,
  lambda30 ~ -0.04341,
  lambda31 ~ 2.2,
  lambda32 ~ 2.2,
  lambda33 ~ 6.6,
  lambda34 ~ 2.2,
  lambda35 ~ 0.1,
  lambda40 ~ 0.67132,
  lambda41 ~ 2.2,
  lambda42 ~ 2.2,
  lambda43 ~ 2.2,
  lambda44 ~ 6.6,
  lambda45 ~ 0.1,
  lambdab ~ 0.0153,
  lambdac ~ 0.05,
  xim1 ~ 0.0008,
  xim2 ~ 0.0007,
  ro ~ 0.05,
  sigman ~ 0.1666,
  sigmat ~ 0.2,
  psid ~ 0.15255,
  psiu ~ 0.92,
  omega0 ~ -0.20594,
  omega1 ~ 1,
  omega2 ~ 2,
  omega3 ~ 0.45621,
  ADDbl ~ 0.02,
  BANDt ~ 0.01,
  BANDb ~ 0.01,
  bot ~ 0.05,
  GRg ~ 0.03,
  GRpr ~ 0.03,
  Nfe ~ 87.181,
  NCAR ~ 0.1,
  NPLk ~ 0.02,
  Rbbar ~ 0.035,
  Rln ~ 0.07,
  RA ~ 0,
  top ~ 0.12
  )
growth_initial <- sfcr_set(
  sigmase ~ 0.16667,
  eta ~ 0.04918,
  phi ~ 0.26417,
  phit ~ 0.26417,
  ADDbl ~ 0.02,
  BANDt ~ 0.01,
  BANDb ~ 0.01,
  bot ~ 0.05,
  GRg ~ 0.03,
  GRpr ~ 0.03,
  Nfe ~ 87.181,
  NCAR ~ 0.1,
  NPLk ~ 0.02,
  Rbbar ~ 0.035,
  Rln ~ 0.07,
  RA ~ 0,
  top ~ 0.12,
  ADDl ~ 0.04592,
  BLR ~ 0.1091,
  BUR ~ 0.06324,
  Ck ~ 7334240,
  CAR ~ 0.09245,
  CONS ~ 52603100,
  ER ~ 1,
  Fb ~ 1744130,
  Fbt ~ 1744140,
  Ff ~ 18081100,
  Fft ~ 18013600,
  FDb ~ 1325090,
  FDf ~ 2670970,
  FUb ~ 419039,
  FUf ~ 15153800,
  FUft ~ 15066200,
  G ~ 16755600,
  Gk ~ 2336160,
  GL ~ 2775900,
  GRk ~ 0.03001,
  INV ~ 16911600,
  Ik ~ 2357910,
  N ~ 87.181,
  Nt ~ 87.181,
  NHUC ~ 5.6735,
  NL ~ 683593,
  NLk ~ 95311,
  NPL ~ 309158,
  NPLke ~ 0.02,
  NUC ~ 5.6106,
  omegat ~ 112852,
  P ~ 7.1723,
  Pbl ~ 18.182,
  Pe ~ 17937,
  PE ~ 5.07185,
  PI ~ 0.0026,
  PR ~ 138659,
  PSBR ~ 1894780,
  Q ~ 0.77443,
  Rb ~ 0.035,
  Rbl ~ 0.055,
  Rk ~ 0.03008,
  Rl ~ 0.06522,
  Rm ~ 0.0193,
  REP ~ 2092310,
  RRl ~ 0.06246,
  S ~ 86270300,
  Sk ~ 12028300,
  Ske ~ 12028300,
  TX ~ 17024100,
  U ~ 0.70073,
  UC ~ 5.6106,
  W ~ 777968,
  WB ~ 67824000,
  Y ~ 86607700,
  Yk ~ 12088400,
  YDr ~ 56446400,
  YDkr ~ 7813270,
  YDkre ~ 7813290,
  YP ~ 73158700,
  z1a ~ 0,
  z1b ~ 0,
  z2a ~ 0,
  z2b ~ 0,
  Bbd ~ 4389790,
  Bbs ~ 4389790,
  Bcbd ~ 4655690,
  Bcbs ~ 4655690,
  Bhd ~ 33439320,
  Bhs ~ 33439320,
  Bs ~ 42484800,
  BLd ~ 840742,
  BLs ~ 840742,
  GD ~ 57728700,
  Ekd ~ 5112.6001,
  Eks ~ 5112.6001,
  Hbd ~ 2025540,
  Hbs ~ 2025540,
  Hhd ~ 2630150,
  Hhs ~ 2630150,
  Hs ~ 4655690,
  IN ~ 11585400,
  INk ~ 2064890,
  INke ~ 2405660,
  INkt ~ 2064890,
  K ~ 127486471,
  Kk ~ 17774838,
  Lfd ~ 15962900,
  Lfs ~ 15962900,
  Lhd ~ 21606600,
  Lhs ~ 21606600,
  Ls ~ 37569500,
  Mh ~ 40510800,
  Ms ~ 40510800,
  OFb ~ 3474030,
  OFbe ~ 3474030,
  OFbt ~ 3638100,
  V ~ 165438779.0377,
  Vfma ~ 159334599.0377,
  Vk ~ 23066350,
  Vf ~ 31361792
  )
growth_cols <- c("Yk", "Sk", "Ck", "Ik", "Kk", "GRk", "U", "RRl", "PI", "P", "W", "N", "ER", "UC", "NHUC", "phi", "Ff",
  "FDf", "FUf", "Lfd", "Eks", "Pe", "YP", "TX", "YDr", "V", "Mh", "Bhd", "BLd", "Pbl", "Bs", "Bbs", "Bbd", "Hs", "Rm",
  "Rl", "ADDl", "OFb", "Fb", "Lhd", "PSBR", "GD")
book("growth", growth_eqs, growth_parameters, 100, sfcr_set(omega0 ~ -0.1), initial = growth_initial, hidden = c("Bbs" = "Bbd"), columns = growth_cols, rhtol = TRUE)
