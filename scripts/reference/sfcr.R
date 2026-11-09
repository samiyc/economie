# The reference trajectories of SIM, SIMEX, PC and PCEX (Godley and Lavoie, 2007, ch. 3 and 4), solved by sfcr
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
