/**
 * OPEN FLEX's parameters, exogenous values and start, as sfcr's vignette writes them (open12_ext, the closure's r_uk
 * and b_cb_ukus_s, open12_init), but for the start's totals, made to add up from their parts as the matrices ask (the
 * vignette's, rounded to five figures, leave 0.007 of UK bills nobody holds): the two governments' bills, the two
 * households' wealth and their demands for the other country's bills, at xr_us = 1 / xr_uk (12.86);
 * scripts/reference/sfcr.R starts sfcr from the same values. xre_uk and xre_us are kept, though no equation reads them (the vignette leaves 12.75
 * and 12.76 out, the expected changes of the exchange rate being zero).
 */
export const EXTERNAL = Object.freeze({
  alpha1_uk: 0.75, alpha1_us: 0.75, alpha2_uk: 0.13333, alpha2_us: 0.13333,
  eps0: -2.1, eps1: 0.7, eps2: 1,
  lambda10: 0.7, lambda11: 5, lambda12: 5, lambda20: 0.25, lambda21: 5, lambda22: 5,
  lambda40: 0.7, lambda41: 5, lambda42: 5, lambda50: 0.25, lambda51: 5, lambda52: 5,
  mu0: -2.1, mu1: 0.7, mu2: 1, nu0m: -0.00001, nu0x: -0.00001, nu1m: 0.7, nu1x: 0.5,
  phi_uk: 0.2381, phi_us: 0.2381, theta_uk: 0.2, theta_us: 0.2,
  dxre_us: 0, dxre_uk: 0, g_k_uk: 16, g_k_us: 16, or_uk: 7, or_us: 7, pg_us: 1, pr_uk: 1.3333, pr_us: 1.3333,
  r_us: 0.03, r_uk: 0.03, b_cb_ukus_s: 0.02031, w_uk: 1, w_us: 1, xre_uk: 1.0003, xre_us: 0.99971,
});

export const INITIAL = Object.freeze({
  b_cb_ukuk_d: 0.27984, b_cb_ukuk_s: 0.27984, b_cb_ukuk_sa: 0.27984, b_cb_ukus_d: 0.0203, b_cb_usus_d: 0.29843,
  b_cb_usus_s: 0.29843, b_uk_s: 138.94684, b_ukuk_d: 102.18, b_ukuk_s: 102.18, b_ukus_d: 36.4930520843747, b_ukus_s: 36.504,
  b_us_s: 139.01274, b_usuk_d: 36.4979461, b_usuk_s: 36.487, b_usus_d: 102.19, b_usus_s: 102.19, h_uk_d: 7.2987,
  h_uk_s: 7.2987, h_us_d: 7.2995, h_us_s: 7.2995, v_k_uk: 152.62, v_k_us: 152.63, v_uk: 145.971752084375, v_us: 145.9874461,
  c_k_uk: 81.393, c_k_us: 81.401, cab_uk: 0, cab_us: 0, cons_uk: 77.851, cons_us: 77.86, ds_k_uk: 97.393,
  ds_k_us: 97.401, ds_uk: 93.154, ds_us: 93.164, f_cb_uk: 0.00869, f_cb_us: 0.00895, g_uk: 15.304, g_us: 15.304,
  im_k_uk: 11.928, im_k_us: 11.926, im_uk: 11.407, im_us: 11.409, kabp_uk: 0.00002, kabp_us: -0.00002,
  n_uk: 73.046, n_us: 73.054, pds_uk: 0.95648, pds_us: 0.95649, pg_uk: 0.99971, pm_uk: 0.95628, pm_us: 0.95661,
  ps_uk: 0.95646, ps_us: 0.9565, px_uk: 0.95634, px_us: 0.95656, py_uk: 0.95648, py_us: 0.95649, s_k_uk: 109.32,
  s_k_us: 109.33, s_uk: 104.56, s_us: 104.57, t_uk: 19.463, t_us: 19.465, x_k_uk: 11.926, x_k_us: 11.928,
  x_uk: 11.406, x_us: 11.41, xr_uk: 1.0003, xr_us: 0.999700089973008, y_k_uk: 97.392, y_k_us: 97.403, y_uk: 93.154,
  y_us: 93.164, yd_uk: 77.851, yd_us: 77.86, ydhs_k_uk: 81.394, ydhs_k_us: 81.402, ydhse_k_uk: 81.394,
  ydhse_k_us: 81.402,
  // sfcr's start for the external values the vignette lists among them.
  b_cb_ukus_s: 0.02031, dxre_us: 0, dxre_uk: 0, g_k_uk: 16, g_k_us: 16, or_uk: 7, or_us: 7, pg_us: 1, pr_uk: 1.3333,
  pr_us: 1.3333, r_uk: 0.03, r_us: 0.03, w_uk: 1, w_us: 1, xre_uk: 1.0003, xre_us: 0.99971,
});
