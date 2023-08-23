module.exports = (email, subject, content) => ({
  from: process.env.MAIL_USER,
  to: email,
  subject: subject,
  attachments: [
    {
      filename: "Logo.png",
      path: process.env.NODE_ENV === 'development'
        ? `${__dirname.slice(0, -8)}/frontend/public/logo512.png`
        : `${__dirname.slice(0, -7)}/public/logo512.png`,
      cid: "logo",
    },
  ],
  html: `
  <div style="max-width: 1000px;border:solid 1px #CBCBCB; margin: 0 auto;padding: 50px 60px;box-sizing:border-box;">
    <div style="max-width:100px; margin-bottom:2rem;"><img src="cid:logo" style="width: 100%;object-fit:contain; object-position:center center;"/></div>
    ${content}
    <p>Thank you,<br/>KEMLabels Team</p>
  </div>`,
});
