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
book <- function(name, eqs, ext, length, change, initial = NULL, hidden = NULL) {
  base <- sfcr_baseline(eqs, ext, periods = length, initial = initial, hidden = hidden, method = "Gauss", tol = 1e-15, max_iter = 1000, .hidden_tol = 1e-6)
  save(base, paste0(name, "-zero"), everything(base))
  run <- sfcr_scenario(base, sfcr_shock(variables = change, start = 5, end = periods), periods = periods, method = "Gauss", tol = 1e-15, max_iter = 1000)
  run <- as.data.frame(run)[-1, ]
  run$period <- length - 1 + seq_len(nrow(run)) + 1
  save(run, paste0(name, "-shock"), everything(base))
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
