/**
 * GROWTH's equations (Godley and Lavoie, 2007, ch. 11), as sfcr's vignette writes them (Macalós, MIT), the book's
 * numbers in the comments (src/book/growth.js).
 */
export const EQUATIONS = `
    Yk ~ Ske + INke - INk[-1]  # 11.1 : Real output
    Ske ~ beta*Sk + (1-beta)*Sk[-1]*(1 + (GRpr + RA))  # 11.2 : Expected real sales
    INke ~ INk[-1] + gamma*(INkt - INk[-1])  # 11.3 : Long-run inventory target
    INkt ~ sigmat*Ske  # 11.4 : Short-run inventory target
    INk ~ INk[-1] + Yk - Sk - NPL/UC  # 11.5 : Actual real inventories
    Kk ~ Kk[-1]*(1 + GRk)  # 11.6 : Real capital stock
    GRk ~ gamma0 + gammau*U[-1] - gammar*RRl  # 11.7 : Growth of real capital stock
    U ~ Yk/Kk[-1]  # 11.8 : Capital utilization proxy
    RRl ~ ((1 + Rl)/(1 + PI)) - 1  # 11.9 : Real interest rate on loans
    PI ~ (P - P[-1])/P[-1]  # 11.10 : Rate of price inflation
    Ik ~ (Kk - Kk[-1]) + delta * Kk[-1]
    Sk ~ Ck + Gk + Ik  # 11.12 : Actual real sales
    S ~ Sk*P  # 11.13 : Value of realized sales
    IN ~ INk*UC  # 11.14 : Inventories valued at current cost
    INV ~ Ik*P  # 11.15 : Nominal gross investment
    K ~ Kk*P  # 11.16 : Nomincal value of fixed capital
    Y ~ Sk*P + (INk - INk[-1])*UC  # 11.17 : Nomincal GDP
    omegat ~ exp(omega0 + omega1*log(PR) + omega2*log(ER + z3*(1 - ER) - z4*BANDt + z5*BANDb))
    ER ~ N[-1]/Nfe[-1]  # 11.19 : Employment rate
    z3a ~ if (ER > (1-BANDb)) {1} else {0}
    z3b ~ if (ER <= (1+BANDt)) {1} else {0}
    z3 ~  z3a * z3b
    z4 ~ if (ER > (1+BANDt)) {1} else {0}
    z5 ~ if (ER < (1-BANDb)) {1} else {0}
    W ~ W[-1] + omega3*(omegat*P[-1] - W[-1])  # 11.21 : Nominal wage
    PR ~ PR[-1]*(1 + GRpr)  # 11.22 : Labor productivity
    Nt ~ Yk/PR  # 11.23 : Desired employment
    N ~ N[-1] + etan*(Nt - N[-1])  # 11.24 : Actual employment --> etan not in the book
    WB ~ N*W  # 11.25 : Nominal wage bill
    UC ~ WB/Yk  # 11.26 : Actual unit cost
    NUC ~ W/PR  # 11.27 : Normal unit cost
    NHUC ~ (1 - sigman)*NUC + sigman*(1 + Rln[-1])*NUC[-1]  # 11.28 : Normal historic unit cost
    P ~ (1 + phi)*NHUC  # 11.29 : Normal-cost pricing
    phi ~ phi[-1] + eps2*(phit[-1] - phi[-1])  # 11.30 : Actual mark-up --> eps2 not in the book
    phit ~ (FUft + FDf + Rl[-1]*(Lfd[-1] - IN[-1])) / ((1 - sigmase)*Ske*UC + (1 + Rl[-1])*sigmase*Ske*UC[-1])
    HCe ~ (1 - sigmase)*Ske*UC + (1 + Rl[-1])*sigmase*Ske*UC[-1]  # 11.32 : Expected historical costs
    sigmase ~ INk[-1]/Ske  # 11.33 : Opening inventories to expected sales ratio
    Fft ~ FUft + FDf + Rl[-1]*(Lfd[-1] - IN[-1])  # 11.34 : Planned entrepeneurial profits of firmss
    FUft ~ psiu*INV[-1]  # 11.35 : Planned retained earnings of firms
    FDf ~ psid*Ff[-1]  # 11.36 : Dividends of firms
    Ff ~ S - WB + (IN - IN[-1]) - Rl[-1]*IN[-1]  # 11.37 : Realized entrepeneurial profits
    FUf ~ Ff - FDf - Rl[-1]*(Lfd[-1] - IN[-1]) + Rl[-1]*NPL  # 11.38 : Retained earnings of firms
    Lfd ~ Lfd[-1] + INV + (IN - IN[-1]) - FUf - (Eks - Eks[-1])*Pe - NPL
    NPL ~ NPLk * Lfs[-1]
    Eks ~ Eks[-1] + ((1 - psiu)*INV[-1])/Pe  # 11.41 : Supply of equities issued by firms
    Rk ~ FDf/(Pe[-1] * Ekd[-1])
    PE ~ Pe/(Ff/Eks[-1])  # 11.43 : Price earnings ratio
    Q ~ (Eks*Pe + Lfd)/(K + IN)  # 11.44 : Tobins Q ratio
    YP ~ WB + FDf + FDb + Rm[-1]*Mh[-1] + Rb[-1]*Bhd[-1] + BLs[-1]
    TX ~ theta*YP  # 11.46 : Income taxes
    YDr ~ YP - TX - Rl[-1]*Lhd[-1]  # 11.47 : Regular disposable income
    YDhs ~ YDr + CG  # 11.48 : Haig-Simons disposable income
    CG ~ (Pbl - Pbl[-1])*BLd[-1] + (Pe - Pe[-1])*Ekd[-1] + (OFb - OFb[-1])
    V ~ V[-1] + YDr - CONS + (Pbl - Pbl[-1])*BLd[-1] + (Pe - Pe[-1])*Ekd[-1] + (OFb - OFb[-1])
    Vk ~ V/P  # 11.51 : Real staock of wealth
    CONS ~ Ck*P  # 11.52 : Consumption
    Ck ~ alpha1*(YDkre + NLk) + alpha2*Vk[-1]  # 11.53 : Real consumption
    YDkre ~ eps*YDkr + (1 - eps)*(YDkr[-1]*(1 + GRpr))  # 11.54 : Expected real regular disposable income
    YDkr ~ YDr/P - ((P - P[-1]) * Vk[-1])/P
    GL ~ eta*YDr  # 11.56 : Gross amount of new personal loans ---> new eta here
    eta ~ eta0 - etar*RRl  # 11.57 : New loans to personal income ratio
    NL ~ GL - REP  # 11.58 : Net amount of new personal loans
    REP ~ deltarep*Lhd[-1]  # 11.59 : Personal loans repayments
    Lhd ~ Lhd[-1] + GL - REP  # 11.60 : Demand for personal loans
    NLk ~ NL/P  # 11.61 : Real amount of new personal loans
    BUR ~ (REP + Rl[-1] * Lhd[-1]) / YDr[-1]
    Bhd ~ Vfma[-1]*(lambda20 + lambda22*Rb[-1] - lambda21*Rm[-1] - lambda24*Rk[-1] - lambda23*Rbl[-1] - lambda25*(YDr/V))
    BLd ~ Vfma[-1]*(lambda30 - lambda32*Rb[-1] - lambda31*Rm[-1] - lambda34*Rk[-1] + lambda33*Rbl[-1] - lambda35*(YDr/V))/Pbl
    Pe ~ Vfma[-1]*(lambda40 - lambda42*Rb[-1] - lambda41*Rm[-1] + lambda44*Rk[-1] - lambda43*Rbl[-1] - lambda45*(YDr/V))/Ekd
    Mh ~ Vfma - Bhd - Pe*Ekd - Pbl*BLd + Lhd  # 11.67 : Money deposits - as a residual
    Vfma ~ V - Hhd - OFb  # 11.68 : Investible wealth
    VfmaA ~ Mh + Bhd + Pbl * BLd + Pe * Ekd
    Hhd ~ lambdac*CONS  # 11.69 : Households demand for cash
    Ekd ~ Eks  # 11.70 : Stock market equilibrium
    G ~ Gk*P  # 11.71 : Pure government expenditures
    Gk ~ Gk[-1]*(1 + GRg)  # 11.72 : Real government expenditures
    PSBR ~ G + BLs[-1] + Rb[-1]*(Bbs[-1] + Bhs[-1]) - TX  # 11.73 : Government deficit --> BLs[-1] missing in the book
    Bs ~ Bs[-1] + G - TX - (BLs - BLs[-1])*Pbl + Rb[-1]*(Bhs[-1] + Bbs[-1]) + BLs[-1]
    GD ~ Bbs + Bhs + BLs*Pbl + Hs  # 11.75 : Government debt
    Fcb ~ Rb[-1]*Bcbd[-1]  # 11.76 : Central bank profits
    BLs ~ BLd  # 11.77 : Bonds are supplied on demand
    Bhs ~ Bhd  # 11.78 : Household bills supplied on demand
    Hhs ~ Hhd  # 11.79 : Cash supplied on demand --> Mistake on the book
    Hbs ~ Hbd  # 11.80 : Reserves supplied on demand
    Hs ~ Hbs + Hhs  # 11.81 : Total supply of cash
    Bcbd ~ Hs  # 11.82 : Central bankd
    Bcbs ~ Bcbd  # 11.83 : Supply of bills to Central bank
    Rb ~ Rbbar  # 11.84 : Interest rate on bills set exogenously
    Rbl ~ Rb + ADDbl  # 11.85 : Long term interest rate
    Pbl ~ 1/Rbl  # 11.86 : Price of long-term bonds
    Ms ~ Mh  # 11.87 : Bank deposits supplied on demand
    Lfs ~ Lfd  # 11.88 : Loans to firms supplied on demand
    Lhs ~ Lhd  # 11.89 : Personal loans supplied on demand
    Hbd ~ ro*Ms  # 11.90 Reserve requirements of banks
    Bbs ~ Bbs[-1] + (Bs - Bs[-1]) - (Bhs - Bhs[-1]) - (Bcbs - Bcbs[-1])
    Bbd ~ Ms + OFb - Lfs - Lhs - Hbd
    BLR ~ Bbd/Ms  # 11.93 : Bank liquidity ratio
    Rm ~ Rm[-1] + z1a*xim1 + z1b*xim2 - z2a*xim1 - z2b*xim2
    z2a ~ if (BLR[-1] > (top + .05)) {1} else {0}
    z2b ~ if (BLR[-1] > top) {1} else {0}
    z1a ~ if (BLR[-1] <= bot) {1} else {0}
    z1b ~ if (BLR[-1] <= (bot -.05)) {1} else {0}
    Rl ~ Rm + ADDl  # 11.98 : Loan interest rate
    OFbt ~ NCAR*(Lfs[-1] + Lhs[-1])  # 11.99 : Long-run own funds target
    OFbe ~ OFb[-1] + betab*(OFbt - OFb[-1])  # 11.100 : Short-run own funds target
    FUbt ~ OFbe - OFb[-1] + NPLke*Lfs[-1]  # 11.101 : Target retained earnings of banks
    NPLke ~ epsb*NPLke[-1] + (1 - epsb)*NPLk[-1]  # 11.102 : Expected proportion of non-performaing loans
    FDb ~ Fb - FUb
    Fbt ~ lambdab*Y[-1] + (OFbe - OFb[-1] + NPLke*Lfs[-1])  # 11.104 : Target profits of banks
    Fb ~ Rl[-1]*(Lfs[-1] + Lhs[-1] - NPL) + Rb[-1]*Bbd[-1] - Rm[-1]*Ms[-1]
    ADDl ~ (Fbt - Rb[-1]*Bbd[-1] + Rm[-1]*(Ms[-1] - (1 - NPLke)*Lfs[-1] - Lhs[-1]))/((1 - NPLke)*Lfs[-1] + Lhs[-1])  # --> I added the lag term to Rm
    FUb ~ Fb - lambdab*Y[-1]  # 11.107 : Actual retained earnings
    OFb ~ OFb[-1] + FUb - NPL  # 11.108 : Own funds of banks
    CAR ~ OFb/(Lfs + Lhs)
    Vf ~ IN + K - Lfd - Ekd * Pe  # Firm's wealth (memo for matrices)
    Ls ~ Lfs + Lhs  # Loans supply (memo for matrices)
`;
