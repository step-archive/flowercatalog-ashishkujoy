const timeStamp = require('./serverUtility/time.js').timeStamp;
const http = require('http');
const WebApp = require('./webapp');
const fs = require('fs');
const CommentHandler = require('./serverUtility/commentHandler.js');
const PORT = 5000;
const lib = require('./handlers.js');

let registeredUsers = ['joy','arvind'];
let session = {};
let commentHandler = new CommentHandler('./data/comments.json');
commentHandler.loadComments();

/*============================================================================*/
const logger = function(req,res) {
  let logs = ['--------------------------------------------------------------',
    `${timeStamp()}`,
    `${req.method}`,
    `${req.url}`,
    `${JSON.stringify(req.headers,null,2)}`,
    ''
  ].join('\n');
  console.log(`${req.method}    ${req.url}`);
  req.fs.appendFile('./data/log.json',logs,()=>{});
}

const getContentType = function(filePath) {
  let fileExtension = filePath.slice(filePath.lastIndexOf('.'));
  let contentTypes = {
    '.html':'text/html',
    '.css':'text/css',
    '.js':'text/javascript',
    '.png':'image/png',
    '.gif':'image/gif',
    '.jpg':'image/jpg',
    '.pdf':'application/pdf'
  }
  return contentTypes[fileExtension];
}

const deliverFile = function(file,contentType,res) {
    res.setHeader('Content-Type',`${contentType}`);
    res.statusCode=200;
    res.write(file);
    res.end();
}

const respondWithNotFound = function(res) {
    res.statusCode = 404;
    res.write('not found');
    res.end();
}

const processFileRequest = function(req,res) {
  if(res.finished) return;
  let filePath = './public'+req.url;
  let contentType = getContentType(filePath);
  req.fs.readFile(filePath,function(error,file){
    if(error) return respondWithNotFound(res);
    deliverFile(file,contentType,res);
  })
}

const tableData = function(data) {
  return `<td>${data}</td>`;
}

const toHtmlTable = function(commentRecord) {
  return `<p>${commentRecord.date} ${commentRecord.name} ${commentRecord.comment}</p>`;
}

const respondLoginFailed = function(res) {
  res.setHeader('Set-Cookie','logInFailed=true');
  res.write('login failed');
  res.end();
}

const responseWithGuestBook = function(res) {
  res.redirect('/guestBook');
}

const isUserAlreadyLogedIn = function(req) {
  return req.sessionid != undefined;
}

const isUserNotLoggedIn = function(req,session) {
  let sessionid = req.cookies.sessionid
  return session[sessionid]==undefined;
}

// const storeComments = function(req,res) {
//   if(isUserNotLoggedIn(req,session)){
//     respondWithNotFound(res);
//     return;
//   }
//   commentHandler.storeComment(req.body);
//   res.statusCode=200;
//   res.end();
// }

const getLogedUserName = function(session,sessionid) {
  return session[sessionid];
}

/*============================================================================*/

let app = WebApp.create();
app.use(logger)
app.usePostProcess(processFileRequest);
app.get('/',(req,res)=>{
  res.redirect('/index.html');
})
app.get('/comments',(req,res)=>{
  lib.processCommentLoadingReq(session,commentHandler,req,res)
});
app.post('/register',(req,res)=>{
  lib.registerUser(registeredUsers,req,res)
});
app.post('/login',(req,res)=>{
  lib.processLoginRequest(registeredUsers,session,req,res)
});
app.get('/logout',lib.processLogoutRequest);
app.post('/submitForm',(req,res)=>{
  lib.storeComments(commentHandler,session,req,res);
});

let server = http.createServer(app);
server.on('error',e=>console.error('**error**',e.message));
server.listen(PORT,(e)=>console.log(`server listening at ${PORT}`));
