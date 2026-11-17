/**
 * OPEN FLEX's equations (Godley and Lavoie, 2007, ch. 12), as sfcr's vignette writes them (Macalós, MIT,
 * vignettes/articles/gl9-open12.Rmd): the shared block of the advanced open economy, 12.1 to 12.88, the book's numbers
 * kept in the order of the vignette, then the closure of the floating rate (12.89FL, 12.90G). The vignette's own
 * choices are kept: 12.9 and 12.10 dropped for 12.53 and 12.54, the MODLER version of 12.82, the central bank's profits
 * of 12.11 corrected (r_us for the US bills). scripts/reference/sfcr.R writes the same equations for sfcr.
 */
export const EQUATIONS = `
  yd_uk ~ (y_uk + r_uk[-1]*b_ukuk_d[-1] + xr_us*r_us[-1]*b_ukus_s[-1])*(1 - theta_uk) + (xr_us - xr_us[-1])*b_ukus_s[-1]
  yd_hs_uk ~ yd_uk + (xr_us - xr_us[-1])*b_ukus_s[-1]
  v_uk ~ v_uk[-1] + yd_uk - cons_uk
  yd_us ~ (y_us + r_us[-1]*b_usus_d[-1] + xr_uk*r_uk[-1]*b_usuk_s[-1])*(1 - theta_us) + (xr_uk - xr_uk[-1])*b_usuk_s[-1]
  yd_hs_us ~ yd_us + d(xr_uk)*b_usuk_s[-1]
  v_us ~ v_us[-1] + yd_us - cons_us
  t_uk ~ theta_uk*(y_uk + r_uk[-1]*b_ukuk_d[-1] + xr_us*r_us[-1]*b_ukus_s[-1])
  t_us ~ theta_us*(y_us + r_us[-1]*b_usus_d[-1] + xr_uk*r_uk[-1]*b_usuk_s[-1])
  f_cb_uk ~ r_uk[-1]*b_cb_ukuk_d[-1] + r_us[-1]*b_cb_ukus_s[-1]*xr_us
  f_cb_us ~ r_us[-1]*b_cb_usus_d[-1]
  b_uk_s ~ b_uk_s[-1] + g_uk + r_uk[-1]*b_uk_s[-1] - t_uk - f_cb_uk
  b_us_s ~ b_us_s[-1] + g_us + r_us[-1]*b_us_s[-1] - t_us - f_cb_us
  cab_uk ~ x_uk - im_uk + xr_us*r_us[-1]*b_ukus_s[-1] - r_uk[-1]*b_usuk_s[-1] + r_us[-1]*b_cb_ukus_s[-1]*xr_us
  kab_uk ~ kabp_uk - (xr_us*(b_cb_ukus_s - b_cb_ukus_s[-1]) + pg_uk*(or_uk - or_uk[-1]))
  cab_us ~ x_us - im_us + xr_uk*r_uk[-1]*b_usuk_s[-1] - r_us[-1]*b_ukus_s[-1] - r_us[-1]*b_cb_ukus_s[-1]
  kab_us ~ kabp_us + (b_cb_ukus_s - b_cb_ukus_s[-1]) - pg_us*(or_us - or_us[-1])
  kabp_uk ~ - (b_ukus_s - b_ukus_s[-1])*xr_us + (b_usuk_s - b_usuk_s[-1])
  kabp_us ~ - (b_usuk_s - b_usuk_s[-1])*xr_uk + (b_ukus_s - b_ukus_s[-1])
  pm_uk ~ exp(nu0m + nu1m*log(py_us) + (1 - nu1m)*log(py_uk) - nu1m*log(xr_uk))
  px_uk ~ exp(nu0x + nu1x*log(py_us) + (1 - nu1x)*log(py_uk) - nu1x*log(xr_uk))
  px_us ~ pm_uk*xr_uk
  pm_us ~ px_uk*xr_uk
  x_k_uk ~ exp(eps0 - eps1*log(pm_us/py_us) + eps2*log(y_k_us))
  im_k_uk ~ exp(mu0 - mu1*log(pm_uk[-1]/py_uk[-1]) + mu2*log(y_k_uk))
  x_k_us ~ im_k_uk
  im_k_us ~ x_k_uk
  x_uk ~ x_k_uk*px_uk
  x_us ~ x_k_us*px_us
  im_uk ~ im_k_uk*pm_uk
  im_us ~ im_k_us*pm_us
  v_k_uk ~ v_uk/pds_uk
  v_k_us ~ v_us/pds_us
  ydhs_k_uk ~ yd_uk/pds_uk - v_k_uk[-1]*(pds_uk - pds_uk[-1])/pds_uk
  ydhs_k_us ~ yd_us/pds_us - v_k_us[-1]*(pds_us - pds_us[-1])/pds_us
  c_k_uk ~ alpha1_uk*ydhse_k_uk + alpha2_uk*v_k_uk[-1]
  c_k_us ~ alpha1_us*ydhse_k_us + alpha2_us*v_k_us[-1]
  ydhse_k_uk ~ (ydhs_k_uk + ydhs_k_uk[-1])/2
  ydhse_k_us ~ (ydhs_k_us + ydhs_k_us[-1])/2
  s_k_uk ~ c_k_uk + g_k_uk + x_k_uk
  s_k_us ~ c_k_us + g_k_us + x_k_us
  s_uk ~ s_k_uk*ps_uk
  s_us ~ s_k_us*ps_us
  ps_uk ~ (1 + phi_uk)*(w_uk*n_uk + im_uk)/s_k_uk
  ps_us ~ (1 + phi_us)*(w_us*n_us + im_us)/s_k_us
  pds_uk ~ (s_uk - x_uk)/(s_k_uk - x_k_uk)
  pds_us ~ (s_us - x_us)/(s_k_us - x_k_us)
  ds_uk ~ s_uk - x_uk
  ds_us ~ s_us - x_us
  ds_k_uk ~ c_k_uk + g_k_uk
  ds_k_us ~ c_k_us + g_k_us
  y_uk ~ s_uk - im_uk
  y_us ~ s_us - im_us
  y_k_uk ~ s_k_uk - im_k_uk
  y_k_us ~ s_k_us - im_k_us
  py_uk ~ y_uk/y_k_uk
  py_us ~ y_us/y_k_us
  cons_uk ~ c_k_uk*pds_uk
  cons_us ~ c_k_us*pds_us
  g_uk ~ g_k_uk*pds_uk
  g_us ~ g_k_us*pds_us
  n_uk ~ y_k_uk/pr_uk
  n_us ~ y_k_us/pr_us
  b_ukuk_d ~ v_uk*(lambda10 + lambda11*r_uk - lambda12*(r_us + dxre_us))
  b_ukus_d ~ v_uk*(lambda20 - lambda21*r_uk + lambda22*(r_us + dxre_us))
  h_uk_d ~ v_uk - b_ukuk_d - b_ukus_d
  b_usus_d ~ v_us*(lambda40 + lambda41*r_us - lambda42*(r_uk + dxre_uk))
  b_usuk_d ~ v_us*(lambda50 - lambda51*r_us + lambda52*(r_uk + dxre_uk))
  h_us_d ~ v_us - b_usus_d - b_usuk_d
  h_us_s ~ h_us_d
  b_usus_s ~ b_usus_d
  b_cb_usus_s ~ b_cb_usus_d
  h_uk_s ~ h_uk_d
  b_ukuk_s ~ b_ukuk_d
  b_cb_ukuk_s ~ b_cb_ukuk_d
  b_cb_usus_d ~ b_cb_usus_d[-1] + (h_us_s - h_us_s[-1]) - (or_us - or_us[-1])*pg_us
  b_cb_ukuk_d ~ b_cb_ukuk_d[-1] + (h_uk_s - h_uk_s[-1]) - (b_cb_ukus_s - b_cb_ukus_s[-1])*xr_us - (or_uk - or_uk[-1])*pg_uk
  pg_uk ~ pg_us/xr_uk
  xr_us ~ 1/xr_uk
  b_usuk_s ~ b_usuk_d*xr_us
  b_cb_ukus_d ~ b_cb_ukus_s*xr_us
  psbr_uk ~ g_uk + r_uk[-1]*b_uk_s[-1] - t_uk - f_cb_uk
  psbr_us ~ g_us + r_us[-1]*b_us_s[-1] - t_us - f_cb_us
  nafa_uk ~ psbr_uk + cab_uk
  nafa_us ~ psbr_us + cab_us
  b_cb_ukuk_sa ~ b_uk_s - b_ukuk_s - b_usuk_s
  nwcb_uk ~ -h_uk_d + b_cb_ukuk_d + b_cb_ukus_d * xr_us + or_uk * pg_uk
  xr_uk ~ b_ukus_s/b_ukus_d
  b_ukus_s ~ b_us_s - b_usus_s - b_cb_usus_d - b_cb_ukus_s
`;
