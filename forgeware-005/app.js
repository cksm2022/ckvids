(() => {
'use strict';
const VERSION = '0.05';
const AGE_KEY = 'revenant_fw005_age';
const TERMS_KEY = 'revenant_fw005_terms';
const STATE_KEY = 'revenant_fw005_local';
const TERMS_VERSION = 'revenant-community-rules-0.05';
let storage;
try { storage=window.localStorage; const probe='__revenant_fw005_probe'; storage.setItem(probe,'1'); storage.removeItem(probe); }
catch (_) { storage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}}; }
const config = window.REVENANT_CONFIG || {};
const backendConfigured = !!(config.supabaseUrl && config.supabasePublishableKey && window.supabase && window.supabase.createClient);
let db = null;
if (backendConfigured) {
  try { db = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey); }
  catch (error) { console.error(error); }
}
const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));
const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const initials = name => String(name || 'R').trim().split(/[\s_-]+/).filter(Boolean).map(s => s[0]).join('').slice(0,2).toUpperCase() || 'R';
function makeDemoPassword(length=20) { const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'; const bytes=new Uint8Array(length); try { window.crypto.getRandomValues(bytes); } catch (_) { for(let i=0;i<length;i++)bytes[i]=Math.floor(Math.random()*256); } return Array.from(bytes,b=>chars[b%chars.length]).join(''); }
const safeImage = file => !!file && /^image\/(png|jpeg|gif|webp|avif)$/i.test(file.type);
const safeMedia = file => safeImage(file) || (!!file && /^video\/(mp4|webm|quicktime)$/i.test(file.type));
const safeName = name => String(name || 'upload').replace(/[^a-zA-Z0-9._-]/g,'_').slice(-90);
const demoSeeds = [
 {id:'seed-1',name:'Mika.exe',handle:'@mikaexe',initials:'ME',avatar:'blue',time:'6 min ago',category:'CREATION',body:'Built a tiny pixel-art world after school. It is not much yet, but every little project starts somewhere. What are you all building?',font_family:'standard',likes:18,comments_count:1,comments:[{id:'c-1',name:'Sora',initials:'S',avatar:'green',body:'The best projects start small. Keep going!',font_family:'standard'}],seed:true},
 {id:'seed-2',name:'ByteBandit',handle:'@bytebandit',initials:'BB',avatar:'orange',time:'18 min ago',category:'GAMING',body:'Unpopular opinion: games are more fun when you play them with friends who are terrible at them.',font_family:'pixel',likes:42,comments_count:2,comments:[{id:'c-2',name:'Nova',initials:'N',body:'Skill issue. Friendship buff activated.',font_family:'mono'},{id:'c-3',name:'Mika.exe',initials:'ME',avatar:'blue',body:'100% accurate.',font_family:'standard'}],seed:true},
 {id:'seed-3',name:'Sora',handle:'@sora_draws',initials:'S',avatar:'green',time:'34 min ago',category:'ART & DESIGN',body:'A little reminder to save your work before trying a new effect. Ask me how I learned this.',font_family:'hand',likes:27,comments_count:0,comments:[],seed:true},
 {id:'seed-4',name:'NullPointer',handle:'@nullpointer',initials:'NP',time:'1 hour ago',category:'DISCUSSION',body:'What is one small feature that would make a social app noticeably nicer to use?',font_family:'standard',likes:31,comments_count:1,comments:[{id:'c-4',name:'ByteBandit',initials:'BB',avatar:'orange',body:'A chronological feed that stays chronological.',font_family:'pixel'}],seed:true}
];
function getStoredState() {
  try { const v = JSON.parse(storage.getItem(STATE_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; }
  catch (_) { return {}; }
}
const state = Object.assign({profile:null,posts:demoSeeds.map(p=>({...p,comments:p.comments.map(c=>({...c}))})),bookmarks:[],likedLocal:[],reduceMotion:false,blockedAccounts:[],mutedAccounts:[],reports:[]},getStoredState());
if (!Array.isArray(state.posts)) state.posts = demoSeeds.map(p=>({...p,comments:p.comments.map(c=>({...c}))}));
if (!Array.isArray(state.bookmarks)) state.bookmarks=[];
if (!Array.isArray(state.likedLocal)) state.likedLocal=[];
if (!Array.isArray(state.notifications)) state.notifications=[{id:'n1',type:'system',title:'Welcome to Forgeware 0.05',body:'Explore new search, polls, drafts, saved posts, and profile tools.',time:'Just now',unread:true},{id:'n2',type:'community',title:'Community spotlight',body:'Indie Dev Corner is looking for new projects.',time:'12 min ago',unread:true},{id:'n3',type:'system',title:'Version update',body:'Forgeware 0.05 is still an evolving prototype.',time:'Today',unread:false}];
if (!state.drafts || typeof state.drafts!=='object') state.drafts={postDraft:''};
if (!Array.isArray(state.joinedCommunities)) state.joinedCommunities=[];
if (!Array.isArray(state.likedReels)) state.likedReels=[];
if (!Array.isArray(state.pollVotes)) state.pollVotes=[];
if (!Array.isArray(state.following)) state.following=[];
if (!Array.isArray(state.blockedAccounts)) state.blockedAccounts=[];
if (!Array.isArray(state.mutedAccounts)) state.mutedAccounts=[];
if (!Array.isArray(state.reports)) state.reports=[];
if (!['red','purple','blue','green'].includes(state.theme)) state.theme='red';
let user = null;
let profile = null;
let remotePosts = [];
let remoteMode = false;
let authMode = 'signup';
let gateStep = '';
let termsOpenedThisVisit = false;
let currentRoute = '/home';
let currentReel = 0;
let selectedFile = null;
let activeCommunityId = '', activeMessagePeer = null;
let messageThreads = [], messageHistory = [], messageSearchResults = [];
let remoteCommunities = [], activeCommunityPosts = [];
let remoteSearchUsers = [], remoteSearchPosts = [], realtimeChannel = null;
let composerMode='post';
let exploreQuery='';
let exploreCategory='ALL';
let selectedFont = 'standard';
let importedFontName = '';
let customFontReady = false;
let customFontFace = null;
let pendingLocalProfile = null;
let generatedDemoPassword = '';
let toastTimer = null;
const commentsOpen = new Set();
const likedRemote = new Set();
const likedSeed = new Set();
const reels = [
 {title:'POV: you fixed one bug',author:'ByteBandit',handle:'@bytebandit',symbol:'⌘',caption:'The bug was a missing semicolon. The celebration was still justified.',tag:'DEV HUMOR',theme:''},
 {title:'Tiny pixel world',author:'Mika.exe',handle:'@mikaexe',symbol:'▦',caption:'A miniature world built one block at a time. More updates soon.',tag:'PIXEL ART',theme:'blue-bg'},
 {title:'Late night build',author:'Sora',handle:'@sora_draws',symbol:'✦',caption:'When the colors finally look right and suddenly it is 2 AM.',tag:'CREATIVE',theme:'green-bg'},
 {title:'Gaming wisdom',author:'NullPointer',handle:'@nullpointer',symbol:'◈',caption:'If it works, do not touch it. If you touch it, make a backup.',tag:'GAMING',theme:'gold-bg'}
];
function saveLocal() {
  if (remoteMode) {
    try { storage.setItem(STATE_KEY, JSON.stringify({profile: state.profile, bookmarks: state.bookmarks, reduceMotion: state.reduceMotion, likedLocal: state.likedLocal, notifications:state.notifications, drafts:state.drafts, joinedCommunities:state.joinedCommunities, likedReels:state.likedReels, pollVotes:state.pollVotes, following:state.following, blockedAccounts:state.blockedAccounts, mutedAccounts:state.mutedAccounts, reports:state.reports, theme:state.theme})); return true; } catch (_) { return false; }
  }
  try { storage.setItem(STATE_KEY, JSON.stringify(state)); return true; }
  catch (_) { toast('Browser storage is full. Remove a large demo attachment or export your data.'); return false; }
}
function toast(message) {
  const el=$('#toast'); if(!el)return;
  el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('show'),3000);
}
function setProfile(p) {
  profile=p||null;
  if (profile) {
    state.profile={id:profile.id||null,username:profile.username||'Member',initials:initials(profile.username),avatar_url:profile.avatar_url||null,bio:profile.bio||''};
    saveLocal();
  }
  updateHeader();
}
function updateHeader() {
  const p=profile||state.profile||{username:'Visitor',initials:'R'};
  const chip=$('#account-button');
  if(chip)chip.textContent=initials(p.username);
  if(chip)chip.title=p.username ? 'Signed in as '+p.username : 'Account settings';
}
function userHandle(name){return '@'+String(name||'member').toLowerCase().replace(/[^a-z0-9_]/g,'').slice(0,24)}
function renderAvatar(name, kind, imageUrl) {
  if(imageUrl && /^https:\/\//.test(imageUrl)) return '<span class="avatar '+escapeHtml(kind||'')+'"><img src="'+escapeHtml(imageUrl)+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit"></span>';
  return '<span class="avatar '+escapeHtml(kind||'')+'" aria-hidden="true">'+escapeHtml(initials(name))+'</span>';
}
function fontOptions(value) {
  const list=[['standard','Standard'],['pixel','Pixel / block'],['mono','Monospace'],['serif','Serif'],['hand','Handwritten']];
  if(customFontReady)list.push(['imported','Imported: '+importedFontName]);
  return list.map(o=>'<option value="'+o[0]+'" '+(value===o[0]?'selected':'')+'>'+escapeHtml(o[1])+'</option>').join('');
}
function fontClass(value){return ({pixel:'pixel',mono:'mono',serif:'serif',hand:'hand',imported:'imported-font'})[value]||''}
function pageHeading(title, subtitle, action='') {
  return '<header class="page-heading"><div><h1>'+title+'</h1><p>'+subtitle+'</p></div>'+(action?'<div class="page-tools">'+action+'</div>':'')+'</header>';
}
function composer() {
  return '<form class="composer" id="post-form"><div class="compose-row">'+renderAvatar((profile||state.profile||{}).username||'R')+'<div class="compose-main"><textarea id="post-body" maxlength="2000" placeholder="What is happening in your world?" aria-label="Write a post">'+escapeHtml((state.drafts||{}).postDraft||'')+'</textarea><div id="attachment-preview"></div><div class="poll-builder hidden" id="poll-builder"><div class="small" style="font-weight:800;margin-bottom:6px">Poll options</div><input class="field" id="poll-option-1" maxlength="90" placeholder="Option 1"><input class="field" id="poll-option-2" maxlength="90" placeholder="Option 2"><input class="field" id="poll-option-3" maxlength="90" placeholder="Option 3 (optional)"><input class="field" id="poll-option-4" maxlength="90" placeholder="Option 4 (optional)"><div class="field-help">One vote per profile in this prototype.</div></div><div class="compose-tools"><span class="post-type-toggle"><button type="button" data-action="set-post-type" data-type="post" class="active">Post</button><button type="button" data-action="set-post-type" data-type="poll">Poll</button></span><label class="file-button">▧ Image / Video<input type="file" id="post-file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif,video/mp4,video/webm,video/quicktime"></label><button type="button" class="tool-button" id="open-font-import">Aa Import font</button><select id="post-font" class="mini-select" aria-label="Post font">'+fontOptions('standard')+'</select><select id="post-category" class="mini-select" aria-label="Post category"><option>GENERAL</option><option>GAMING</option><option>ART & DESIGN</option><option>TECH</option><option>DISCUSSION</option><option>MEMES</option></select><span class="spacer"></span><button type="button" class="tool-button" data-action="save-draft">Save draft</button><button class="button button-primary button-small" type="submit">Publish ↗</button></div><div class="field-help">'+(remoteMode?'Posts are shared with signed-in users.':'Demo mode: posts stay in this browser.')+'</div></div></div></form>';
}

function formatTime(iso) {
  if(!iso)return 'just now';
  const d=new Date(iso);if(Number.isNaN(d.getTime()))return escapeHtml(iso);
  const delta=Math.max(0,Math.floor((Date.now()-d.getTime())/60000));
  if(delta<1)return 'just now';if(delta<60)return delta+'m ago';if(delta<1440)return Math.floor(delta/60)+'h ago';return Math.floor(delta/1440)+'d ago';
}
function renderComment(c) {
  return '<div class="comment">'+renderAvatar(c.name,c.avatar,c.avatar_url)+'<div class="comment-bubble"><div><span class="comment-name">'+escapeHtml(c.name||'Member')+'</span><span class="timestamp">· '+formatTime(c.created_at)+'</span></div><div class="comment-text '+fontClass(c.font_family)+'">'+escapeHtml(c.body||c.text||'')+'</div></div></div>';
}
function renderPost(p, showComments=false) {
  const id=String(p.id);
  const liked=remoteMode?likedRemote.has(id):(!!p.liked||likedSeed.has(id));
  const likeCount=Number(p.likes_count!=null?p.likes_count:p.likes||0);
  const followKey=remoteMode?p.user_id:p.name;
  const isSelf=remoteMode?(!!user&&p.user_id===user.id):String(p.name||'')===String((profile||state.profile||{}).username||'');
  const followButton=(!isSelf&&followKey)?'<button class="tool-button" data-action="follow-user" data-id="'+escapeHtml(followKey)+'">'+(state.following.includes(String(followKey))?'Following':'Follow')+'</button>':'';
  const comments=Array.isArray(p.comments)?p.comments:[];
  const media=p.media_url&&/^https:\/\//.test(p.media_url)?(String(p.media_type||'').startsWith('video/')?'<video class="post-video" controls playsinline preload="metadata" src="'+escapeHtml(p.media_url)+'" aria-label="Video post"></video>':'<img class="post-media" loading="lazy" src="'+escapeHtml(p.media_url)+'" alt="Post attachment">'):(p.attachmentData&&/^data:image\/(png|jpeg|gif|webp|avif);base64,/i.test(p.attachmentData)?'<img class="post-media" loading="lazy" src="'+p.attachmentData+'" alt="Post attachment">':'');
  let pollMarkup='';
  const poll=p.poll||(p.poll_data?{options:p.poll_data.options||[],votes:p.poll_votes||[],votedIndex:p.voted_index}:null);
  if(poll&&Array.isArray(poll.options)&&poll.options.length){
    const votes=Array.isArray(poll.votes)?poll.votes:[];
    const total=votes.reduce((sum,n)=>sum+Number(n||0),0);
    const votedIndex=Number.isInteger(poll.votedIndex)?poll.votedIndex:null;
    pollMarkup='<div class="poll-box"><h4>▥ COMMUNITY POLL</h4>'+poll.options.map((opt,index)=>{
      const pct=total?Math.round(Number(votes[index]||0)/total*100):0;
      return '<button type="button" class="poll-option '+(votedIndex===index?'chosen':'')+'" data-action="poll-vote" data-id="'+escapeHtml(id)+'" data-option="'+index+'" '+(votedIndex!==null?'disabled':'')+'><span class="poll-meter" style="width:'+(votedIndex!==null?pct:0)+'%"></span><span class="poll-label">'+escapeHtml(opt)+'</span><span class="poll-number">'+(votedIndex!==null?pct+'%':'Vote')+'</span></button>';
    }).join('')+'<div class="poll-meta">'+total+' vote'+(total===1?'':'s')+(votedIndex!==null?' · You voted':' · Choose one option')+'</div></div>';
  }
  let replyMarkup='';
  if(showComments) {
    replyMarkup='<section class="comments"><div class="tiny muted">'+(comments.length?comments.length+' replies':'Start the conversation')+'</div>'+comments.map(renderComment).join('')+'<form class="comment-form" data-comment-form="'+escapeHtml(id)+'"><input name="comment" maxlength="500" required placeholder="Write a reply…" aria-label="Write a reply"><button class="button button-primary button-small" type="submit">Reply</button></form><div class="comment-tools"><label>Text style <select data-comment-font="'+escapeHtml(id)+'">'+fontOptions('standard')+'</select></label><span class="tiny muted">Each reply can have its own font.</span></div></section>';
  }
  return '<article class="post-card" data-post="'+escapeHtml(id)+'"><div class="post-header">'+renderAvatar(p.name,p.avatar,p.avatar_url)+'<div class="post-author"><div class="author-meta"><span class="author-name">'+escapeHtml(p.name||'Member')+'</span><span class="handle">'+escapeHtml(p.handle||userHandle(p.name))+'</span>'+(p.badge?'<span class="pill">'+escapeHtml(p.badge)+'</span>':'')+followButton+'</div><div class="timestamp">'+formatTime(p.created_at||p.time)+'</div></div><button class="post-dots" data-action="post-menu" data-id="'+escapeHtml(id)+'" aria-label="Post options">···</button></div><div class="post-body '+fontClass(p.font_family||p.font)+'">'+escapeHtml(p.body||p.text||'')+'</div>'+media+pollMarkup+'<span class="category-chip">'+escapeHtml(p.category||p.tag||'GENERAL')+'</span><div class="post-actions"><button class="action-button '+(liked?'active':'')+'" data-action="like" data-id="'+escapeHtml(id)+'"><span class="symbol">'+(liked?'♥':'♡')+'</span>'+likeCount+'</button><button class="action-button" data-action="comments" data-id="'+escapeHtml(id)+'"><span class="symbol">▱</span>'+(p.comments_count||comments.length||0)+'</button><button class="action-button" data-action="share" data-id="'+escapeHtml(id)+'"><span class="symbol">↗</span>Share</button><button class="action-button" data-action="repost" data-id="'+escapeHtml(id)+'"><span class="symbol">⟳</span>Repost</button><span class="action-spacer"></span><button class="action-button '+(state.bookmarks.includes(id)?'active':'')+'" data-action="bookmark" data-id="'+escapeHtml(id)+'"><span class="symbol">⌑</span>Save</button></div>'+replyMarkup+'</article>';
}

function renderHome() {
  const items=state.posts.filter(p=>!isSuppressedPost(p)).slice(0,2);
  return '<section class="hero"><div class="hero-content"><span class="eyebrow">FORGEWARE 0.05 · SOCIAL PREVIEW</span><h1>Your corner of the <span class="accent">internet.</span></h1><p>Posts, people, short videos, and communities in one place. The foundation is here; shared accounts and Posts can be enabled with your own Supabase project.</p><div class="hero-actions"><a href="#/posts" class="button button-primary">Write a post ↗</a><a href="#/reels" class="button button-quiet">Explore Reels ▣</a></div></div></section><div class="stats"><div class="stat-card"><b>'+state.posts.length+'</b><span>'+(remoteMode?'Shared posts loaded':'Demo posts')+'</span></div><div class="stat-card"><b>09</b><span>Destinations</span></div><div class="stat-card"><b>0.05</b><span>Current build</span></div></div><div class="section-heading">Recent posts <a class="button button-small" href="#/posts">See all ↗</a></div>'+(items.length?items.map(p=>renderPost(p,false)).join(''):'<div class="empty-state"><div class="empty-icon">▤</div><strong>No posts yet</strong>Open Posts to publish the first one.</div>')+'<div class="notice">Forgeware 0.05 is still a prototype. The backend status is shown in Settings.</div>';
}
function renderPosts(feed=false) {
  let items=state.posts.filter(p=>!isSuppressedPost(p));
  if(feed && Array.isArray(state.following) && state.following.length) items=items.filter(p=>state.following.includes(String(remoteMode?p.user_id:p.name)));
  if(feed)items.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
  return pageHeading(feed?'Your Feed':'Posts',feed?'A timeline of new posts and conversations.':'Your place for text posts, memes, pictures, polls, links, and discussions.','<button class="button button-small" data-action="focus-compose">＋ Compose</button>')+composer()+'<div class="section-heading"><span>'+(feed?'LATEST POSTS':'THE DISCUSSION BOARD')+'</span><span class="pill">'+items.length+' posts</span></div>'+(items.length?items.map(p=>renderPost(p,commentsOpen.has(String(p.id)))).join(''):'<div class="empty-state"><div class="empty-icon">▤</div><strong>No posts yet</strong>Be the first to start a conversation.</div>')+(remoteMode?'':'<p class="demo-notice">Demo posts are examples. Your new posts are stored only in this browser until a backend is connected.</p>');
}
function renderReels(){
 const videos=state.posts.filter(p=>p.media_url&&String(p.media_type||'').startsWith('video/'));
 if(videos.length)return pageHeading('Reels','Videos uploaded to public Revenant posts.','<span class="pill">'+videos.length+' VIDEOS</span>')+'<div class="reels-video-list">'+videos.map(p=>'<article class="reel-video-card"><video controls playsinline preload="metadata" src="'+escapeHtml(p.media_url)+'"></video><div class="reel-video-meta">'+renderAvatar(p.name,p.avatar,p.avatar_url)+'<div class="reel-video-copy"><b>'+escapeHtml(p.name||'Member')+'</b><p>'+escapeHtml(p.body||'')+'</p><span class="tiny muted">'+formatTime(p.created_at)+'</span></div></div><div class="reel-video-actions"><a class="button button-small" href="#/posts">Open Posts</a><button class="button button-small" data-action="share" data-id="'+escapeHtml(p.id)+'">Share post</button></div></article>').join('')+'</div>';
 const r=reels[currentReel%reels.length];
 return pageHeading('Reels','Short videos from the Revenant community.','<span class="pill">DEMO '+(currentReel+1)+' / '+reels.length+'</span>')+'<div class="reels-wrap"><article class="reel-card '+r.theme+'"><div class="reel-watermark">R</div><div class="reel-top"><span class="dot"></span> REVENANT REELS <span style="margin-left:auto">'+escapeHtml(r.tag)+'</span></div><div class="reel-main"><div class="reel-symbol">'+r.symbol+'</div><h2>'+escapeHtml(r.title)+'</h2><p>'+escapeHtml(r.caption)+'</p><span class="pill">SAMPLE CARD · NOT A VIDEO</span></div><div class="reel-bottom"><div class="reel-copy"><b>'+escapeHtml(r.author)+' <span class="muted" style="font-weight:400">'+escapeHtml(r.handle)+'</span></b><p>'+escapeHtml(r.caption)+'</p></div><div class="reel-controls"><button data-action="reel-like" aria-label="Like sample Reel">'+(state.likedReels&&state.likedReels.includes(currentReel)?'♥':'♡')+'</button><button data-action="reel-comment" aria-label="Comment on sample Reel">▱</button><button data-action="reel-share" aria-label="Share sample Reel">↗</button></div></div></article><div class="reel-pagination"><button data-action="reel-prev">↑ Previous</button><button data-action="reel-next">Next ↓</button></div><section class="panel" style="padding:14px;margin-top:12px"><b>Upload a real Reel</b><p class="muted small">Connect Supabase, open Posts, attach an MP4/WebM/MOV video up to 50 MB and publish it. It will appear here when shared posts load.</p><a class="button button-primary button-small" href="#/posts">Open composer ↗</a></section></div>';
}
function rulesMarkup(short=false) {
 const rules=[
  ['01','No illegal content.','Do not use Revenant to facilitate crimes or distribute unlawful content.'],
  ['02','Protect minors.','Sexual exploitation of minors is prohibited, without exception.'],
  ['03','No credible threats, doxxing, or targeted harassment.','Strong opinions and edgy humor are welcome; threats and targeted abuse are not.'],
  ['04','No scams, malware, or account theft.','Do not steal credentials, distribute malicious files, or defraud people.'],
  ['05','Respect privacy and consent.','Do not publish private information or intimate imagery without authorization.'],
  ['06','Do not abuse the platform.','No spam, impersonation for fraud, or deliberate disruption. Block, mute, and report when needed.']
 ];
 return '<div class="rules-list">'+rules.map(r=>'<div class="rule"><span class="rule-number">'+r[0]+'</span><div><strong>'+r[1]+'</strong><p>'+r[2]+'</p></div></div>').join('')+'</div>'+(short?'':'<div class="notice">These are the prototype community rules, not a complete legal Terms of Service or Privacy Policy. A public release needs complete terms, privacy disclosures, appeal procedures, and legal review for each launch region.</div>');
}
function renderTerms(){
 return pageHeading('Terms of Service','Community rules and current prototype limitations.')+'<section class="panel" style="padding:17px;margin-bottom:13px"><span class="eyebrow">COMMUNITY RULES</span><h2 style="margin:6px 0;font-size:20px">Minimal rules. Essential boundaries.</h2><p class="muted small">We want people to share ideas, create things, joke around, disagree, and build communities. These are the baseline rules.</p></section>'+rulesMarkup(false)+'<div class="notice">Public-release note: these rules are not a substitute for complete Terms of Service. The operator must review and publish full terms before accepting real public users.</div><p><a class="button button-small" href="#/privacy">Read the privacy notice ↗</a></p>';
}
function renderPrivacyPolicy(){
 return pageHeading('Privacy notice','A plain-language summary of data handling in this release.')+'<section class="panel policy-panel"><h2>What this prototype stores</h2><p>In local demo mode, profile details, draft text, posts, bookmarks, appearance settings and demo safety controls are stored in this browser. They are not automatically synced across devices.</p><h2>When Supabase is configured</h2><p>The application sends account identity handled by Supabase Auth, username/profile information, posts, comments, likes, follows, bookmarks, private direct messages, community memberships/posts, uploaded media and notification/read state to the configured project.</p><h2>Public and private content</h2><p>Posts and uploaded post media are intended to be public. Direct messages are designed for sender and recipient and protected by database row-level policies, but are not end-to-end encrypted. Do not post secrets or highly sensitive personal information.</p><h2>Uploaded media</h2><p>Images and videos are stored in the Supabase Storage bucket configured by the service. Public-post media is intentionally publicly readable. The service operator is responsible for access settings, storage limits, deletion and retention.</p><h2>Service providers and retention</h2><p>The front end uses Supabase and loads its JavaScript library from a public CDN. The operator must review provider terms and privacy documentation and configure retention, deletion, backups and incident response.</p><h2>Account rights and contact</h2><p>This prototype does not provide a complete automated account-deletion or export workflow for all cloud records. The operator must add a contact address, explain rights, set retention periods and obtain jurisdiction-specific review before public launch.</p><div class="notice">This is a technical disclosure draft, not legal advice or a complete jurisdiction-specific privacy policy. Do not treat it as legally launch-ready without review.</div></section>';
}
function safetyTargetKey(post){
 return String(remoteMode ? (post && post.user_id || '') : (post && post.name || '')).trim();
}
function isSuppressedPost(post){
 const key=safetyTargetKey(post);
 if(!key)return false;
 return (state.blockedAccounts||[]).map(String).includes(key)||(state.mutedAccounts||[]).map(String).includes(key);
}
async function refreshSafetyControls(){
 if(!(remoteMode&&db&&user))return;
 try{
  const [blocks,mutes,reports]=await Promise.all([
   db.from('account_blocks').select('blocked_id').eq('blocker_id',user.id),
   db.from('account_mutes').select('muted_id').eq('blocker_id',user.id),
   db.from('content_reports').select('id,target_user_id,post_id,reason,details,status,created_at').eq('reporter_id',user.id).order('created_at',{ascending:false}).limit(50)
  ]);
  if(!blocks.error)state.blockedAccounts=(blocks.data||[]).map(x=>String(x.blocked_id));
  else console.warn('Could not load block controls. Apply the Forgeware 0.05 schema.',blocks.error.message);
  if(!mutes.error)state.mutedAccounts=(mutes.data||[]).map(x=>String(x.muted_id));
  else console.warn('Could not load mute controls. Apply the Forgeware 0.05 schema.',mutes.error.message);
  if(!reports.error)state.reports=(reports.data||[]).map(x=>({id:x.id,target:x.target_user_id||'',post_id:x.post_id||'',reason:x.reason||'Other',details:x.details||'',status:x.status||'received',created_at:x.created_at}));
  else console.warn('Could not load reports. Apply the Forgeware 0.05 schema.',reports.error.message);
  saveLocal();
 }catch(err){console.warn('Safety controls could not be refreshed.',err);}
}
async function toggleSafetyControl(kind,target,name){
 target=String(target||'').trim();
 const field=kind==='block'?'blockedAccounts':'mutedAccounts';
 const table=kind==='block'?'account_blocks':'account_mutes';
 const targetColumn=kind==='block'?'blocked_id':'muted_id';
 state[field]=Array.isArray(state[field])?state[field]:[];
 if(!target){toast('This account cannot be controlled from the current demo item.');return}
 const currentName=String((profile||state.profile||{}).username||'');
 if((remoteMode&&user&&target===String(user.id))||(!remoteMode&&String(name||target).toLowerCase()===currentName.toLowerCase())){
  toast('You cannot block or mute your own account.');return;
 }
 const removing=state[field].map(String).includes(target);
 if(remoteMode&&db&&user){
  if(removing){
   const {error}=await db.from(table).delete().eq('blocker_id',user.id).eq(targetColumn,target);
   if(error)throw error;
  }else{
   const row={blocker_id:user.id};row[targetColumn]=target;
   const {error}=await db.from(table).insert(row);
   if(error)throw error;
  }
 }
 if(removing)state[field]=state[field].filter(x=>String(x)!==target);
 else state[field].push(target);
 if(kind==='block'&&!removing){
  state.following=(state.following||[]).filter(x=>String(x)!==target);
  if(remoteMode&&db&&user){try{await db.from('follows').delete().eq('follower_id',user.id).eq('following_id',target)}catch(err){console.warn(err)}}
 }
 saveLocal();renderApp();
 toast((removing?'Removed ':'Added ')+(kind==='block'?'block for ':'mute for ')+(name||target)+'.');
}
function showPostOptions(post){
 if(!post)return;
 const root=$('#modal-root');
 const target=safetyTargetKey(post);
 const name=String(post.name||'Member');
 const blocked=(state.blockedAccounts||[]).map(String).includes(target);
 const muted=(state.mutedAccounts||[]).map(String).includes(target);
 root.innerHTML='<div class="modal-backdrop" data-action="modal-backdrop"><section class="modal safety-modal" role="dialog" aria-modal="true" aria-labelledby="post-options-title"><div class="eyebrow">SAFETY & CONTROL</div><h2 id="post-options-title">Post options</h2><p>Choose what happens to this post or this account. Reports are private to the reporter in the connected prototype.</p><div class="safety-modal-actions"><button class="button button-small" data-action="report-post" data-id="'+escapeHtml(post.id)+'" data-user-key="'+escapeHtml(target)+'" data-user-name="'+escapeHtml(name)+'">Report post</button><button class="button button-small" data-action="mute-user" data-id="'+escapeHtml(post.id)+'" data-user-key="'+escapeHtml(target)+'" data-user-name="'+escapeHtml(name)+'">'+(muted?'Unmute account':'Mute account')+'</button><button class="button button-small '+(blocked?'':'button-primary')+'" data-action="block-user" data-id="'+escapeHtml(post.id)+'" data-user-key="'+escapeHtml(target)+'" data-user-name="'+escapeHtml(name)+'">'+(blocked?'Unblock account':'Block account')+'</button></div><div class="modal-actions"><button class="button button-primary" data-action="close-modal">Done</button></div></section></div>';
}
function showReportReasons(postId,target,name){
 const reasons=['Spam or scams','Harassment or bullying','Hate or credible threats','Privacy or doxxing','Sexual exploitation','Illegal or dangerous activity','Other'];
 const root=$('#modal-root');
 root.innerHTML='<div class="modal-backdrop" data-action="modal-backdrop"><section class="modal safety-modal" role="dialog" aria-modal="true" aria-labelledby="report-title"><div class="eyebrow">PRIVATE REPORT</div><h2 id="report-title">Why are you reporting this?</h2><p>Choose the closest reason. You can add context on the next step. Reporting does not automatically remove the post.</p><div class="report-reasons">'+reasons.map(r=>'<button class="safety-choice" data-action="report-reason" data-id="'+escapeHtml(postId)+'" data-user-key="'+escapeHtml(target)+'" data-user-name="'+escapeHtml(name)+'" data-reason="'+escapeHtml(r)+'">'+escapeHtml(r)+' <span>›</span></button>').join('')+'</div><div class="modal-actions"><button class="button button-small" data-action="close-modal">Cancel</button></div></section></div>';
}
async function submitContentReport(postId,target,name,reason,details){
 const cleanDetails=String(details||'').trim().slice(0,1000);
 if(remoteMode&&db&&user){
  const payload={reporter_id:user.id,target_user_id:target||null,post_id:postId,reason,details:cleanDetails};
  const {error}=await db.from('content_reports').insert(payload);
  if(error)throw error;
  await refreshSafetyControls();
 }else{
  state.reports=Array.isArray(state.reports)?state.reports:[];
  state.reports.unshift({id:'local-report-'+Date.now(),target:name||target,post_id:String(postId),reason,details:cleanDetails,status:'received',created_at:new Date().toISOString()});
  saveLocal();
 }
 addNotification({type:'system',title:'Report submitted',body:'Your report was saved. In this prototype, reports are recorded but are not automatically reviewed or acted upon.',unread:true});
 saveLocal();renderApp();
 toast(remoteMode?'Report submitted privately.':'Report saved in this browser only.');
}
function renderSafetyCenter(){
 const blocked=Array.isArray(state.blockedAccounts)?state.blockedAccounts:[];
 const muted=Array.isArray(state.mutedAccounts)?state.mutedAccounts:[];
 const reports=Array.isArray(state.reports)?state.reports:[];
 const controlRows=(items,kind,label)=>items.length?items.map(key=>{
  const shown=remoteMode?'Account ID '+String(key).slice(0,8)+'…':String(key);
  return '<div class="safety-row"><div><strong>'+escapeHtml(shown)+'</strong><small>'+label+'</small></div><button class="button button-small" data-action="remove-safety-control" data-kind="'+kind+'" data-user-key="'+escapeHtml(key)+'" data-user-name="'+escapeHtml(shown)+'">Remove</button></div>';
 }).join(''):'<div class="safety-empty">No '+label.toLowerCase()+' yet.</div>';
 const reportRows=reports.length?reports.slice(0,30).map(r=>'<div class="safety-row report-row"><div><strong>'+escapeHtml(r.reason||'Report')+'</strong><small>'+escapeHtml(r.status||'received')+' · '+escapeHtml(formatTime(r.created_at))+(r.target?' · '+escapeHtml(remoteMode?'Account ID '+String(r.target).slice(0,8)+'…':r.target):'')+'</small>'+(r.details?'<p>'+escapeHtml(r.details)+'</p>':'')+'</div><span class="pill">PRIVATE</span></div>').join(''):'<div class="safety-empty">You have not submitted any reports.</div>';
 return pageHeading('Safety Center','Control what you see and review the reports you have submitted.','<span class="pill">YOUR CONTROLS</span>')+
  '<section class="panel safety-intro"><div class="eyebrow">YOUR EXPERIENCE</div><h2>Curate your space.</h2><p>Muted accounts have their posts hidden from your views. Blocked accounts are also hidden and removed from your following list in this prototype. These settings do not yet enforce server-wide visibility or stop the other account from interacting with you.</p><div class="safety-summary"><span><b>'+blocked.length+'</b> blocked</span><span><b>'+muted.length+'</b> muted</span><span><b>'+reports.length+'</b> reports</span></div></section>'+
  '<section class="setting-card safety-section"><label>Blocked accounts</label><p>Hide their posts from Home, Feed, Posts, Explore, and Saved. You can undo a block here.</p><div class="safety-list">'+controlRows(blocked,'block','Blocked account')+'</div></section>'+
  '<section class="setting-card safety-section"><label>Muted accounts</label><p>Hide their posts without using the block control.</p><div class="safety-list">'+controlRows(muted,'mute','Muted account')+'</div></section>'+
  '<section class="setting-card safety-section"><label>Your reports</label><p>Reports are private to the reporter. A record here is not confirmation that a moderator reviewed or actioned it.</p><div class="safety-list">'+reportRows+'</div></section>'+
  '<div class="notice">Safety tools in Forgeware 0.05 are prototype controls. A production service still needs server-enforced blocks, moderation queues, reviewer permissions, abuse-rate limits, appeals, audit logs, and documented response procedures.</div>';
}

function renderSettings() {
 const connected=!!db;const p=profile||state.profile||{};
 return pageHeading('Settings','Personalize Revenant and manage this prototype.')+'<div class="setting-grid"><section class="setting-card"><label>Your profile</label><p>Customize your display name and short bio.</p><input class="field" id="profile-name" maxlength="24" value="'+escapeHtml(p.username||'')+'" placeholder="Display name"><label class="field-label" for="profile-bio">Bio</label><textarea class="text-area" id="profile-bio" maxlength="280" placeholder="A little about you">'+escapeHtml(p.bio||'')+'</textarea><button class="button button-primary button-small" id="save-profile" style="margin-top:10px">Save profile</button></section><section class="setting-card"><label>Accent theme</label><p>Keep Revenant keeps its dark surfaces and choose a personal accent.</p><select class="field" id="profile-theme"><option value="red" '+(state.theme==='red'?'selected':'')+'>Revenant red</option><option value="purple" '+(state.theme==='purple'?'selected':'')+'>Purple neon</option><option value="blue" '+(state.theme==='blue'?'selected':'')+'>Electric blue</option><option value="green" '+(state.theme==='green'?'selected':'')+'>Acid green</option></select><div class="status-line">Theme preference is stored locally in this browser.</div></section><section class="setting-card"><label>Backend connection</label><p>Real cross-device accounts and shared posts use Supabase Auth, Postgres, and Row Level Security.</p><span class="pill"><span class="dot" style="background:'+(connected?'#66d7a4':'#d9a24d')+'"></span>'+(connected?'Project configured':'Not configured · local demo')+'</span><div class="field-help">'+(connected?'Configured URL: '+escapeHtml(config.supabaseUrl):'Add your project URL and publishable key in config.js, then run supabase-schema.sql in the Supabase SQL Editor.')+'</div><a class="button button-small" href="https://supabase.com/dashboard" target="_blank" rel="noopener" style="margin-top:10px">Open Supabase ↗</a></section><section class="setting-card"><label>Import a font</label><p>Load a locally licensed TTF, OTF, WOFF, or WOFF2 file for previews in this browser. ZIP extraction and server-wide font hosting come later.</p><label class="file-button" style="border:1px solid var(--line);border-radius:9px">＋ Choose font<input type="file" id="font-upload" accept=".ttf,.otf,.woff,.woff2"></label><div class="status-line" id="font-status">'+(customFontReady?'Loaded for this session: '+escapeHtml(importedFontName):'No custom font loaded in this session.')+'</div></section><section class="setting-card"><label>Appearance</label><p>Revenant uses a dark interface with an accent you can change.</p><label class="field-label"><input type="checkbox" id="reduce-motion" '+(state.reduceMotion?'checked':'')+'> Reduce decorative motion</label><p class="field-help">Also respects your device reduced-motion setting.</p></section><section class="setting-card"><label>Safety & privacy</label><p>Control whose posts appear to you and send a report when a post violates the community rules.</p><div class="status-line">'+state.blockedAccounts.length+' blocked · '+state.mutedAccounts.length+' muted · '+state.reports.length+' reports recorded in your account/browser</div><a class="button button-small button-primary" href="#/safety" style="margin-top:10px">Open Safety Center ↗</a></section><section class="setting-card"><label>Onboarding</label><p>Replay the age gate and Terms screen.</p><button class="button button-small" data-action="reset-onboarding">Reset onboarding</button></section><section class="setting-card"><label>Local demo data</label><p>Export your demo content or clear the stored prototype data in this browser.</p><button class="button button-small" id="export-data">Export JSON</button> <button class="button button-small" id="reset-demo">Reset demo</button></section><section class="setting-card"><label>Account session</label><p>'+(user?'Signed in as '+escapeHtml((profile||{}).username||user.email||'member'):'No backend account signed in.')+'</p>'+(user?'<button class="button button-small" data-action="signout">Sign out</button>':'<button class="button button-small button-primary" data-action="open-auth">Sign in / create account</button>')+'</section></div><div class="notice">Never place a Supabase service-role or secret key in frontend code. Forgeware should use only a publishable key in the browser with database Row Level Security enabled.</div>';
}

function renderProfile() {
 const p=profile||state.profile||{username:'Visitor'};
 const items=state.posts.filter(x=>!isSuppressedPost(x)&&(remoteMode?x.user_id===user?.id:x.own));
 return '<section class="hero"><div class="hero-content"><span class="eyebrow">YOUR REVENANT ID</span><h1>'+escapeHtml(p.username||'Visitor')+'</h1><p class="profile-bio">'+escapeHtml(p.bio||'Your profile and post history. Add a bio in Settings.')+'</p><div class="hero-actions"><a class="button button-primary" href="#/settings">Edit profile</a><a class="button button-quiet" href="#/posts">Write a post</a></div></div></section><div class="stats"><div class="stat-card"><b>'+items.length+'</b><span>Your posts</span></div><div class="stat-card"><b>Free</b><span>Profile styles</span></div><div class="stat-card"><b>0.05</b><span>Current build</span></div></div><div class="section-heading">Your posts</div>'+(items.length?items.map(p=>renderPost(p,commentsOpen.has(String(p.id)))).join(''):'<div class="empty-state"><div class="empty-icon">◌</div><strong>No posts here yet</strong>Publish something from Posts to build your profile.</div>');
}

async function refreshRemoteCommunities(){
 if(!(remoteMode&&db&&user))return;
 const [groups,memberships]=await Promise.all([db.from('communities').select('id,name,slug,description,category,created_by,created_at').order('created_at',{ascending:false}).limit(100),db.from('community_members').select('community_id,member_id,role')]);
 if(groups.error)throw groups.error;if(memberships.error)throw memberships.error;
 const rows=memberships.data||[];
 remoteCommunities=(groups.data||[]).map(g=>({...g,members:rows.filter(m=>m.community_id===g.id).length,role:(rows.find(m=>m.community_id===g.id&&m.member_id===user.id)||{}).role||null}));
 state.joinedCommunities=remoteCommunities.filter(g=>g.role).map(g=>g.id);saveLocal();
}
async function refreshCommunityPosts(){
 if(!(remoteMode&&db&&activeCommunityId))return;
 const {data,error}=await db.from('posts').select('id,user_id,body,category,font_family,media_url,media_type,community_id,created_at,post_type,poll_data,profiles(username,avatar_url)').eq('community_id',activeCommunityId).order('created_at',{ascending:false}).limit(60);
 if(error)throw error;activeCommunityPosts=(data||[]).map(r=>({...r,name:r.profiles?.username||'Member',handle:userHandle(r.profiles?.username||'Member'),avatar_url:r.profiles?.avatar_url,likes_count:0,comments_count:0,comments:[]}));renderApp();
}
function renderCommunities(){
 const seeded=[{id:'local-seed-pw',initials:'PW',name:'Pixel Workshop',description:'Art, sprites, fan art, and tiny worlds.',category:'Art & design'},{id:'local-seed-id',initials:'ID',name:'Indie Dev Corner',description:'Build logs, coding questions, and game prototypes.',category:'Technology'},{id:'local-seed-mc',initials:'MC',name:'Minecraft & Mods',description:'Modpacks, builds, technical help, and survival stories.',category:'Gaming'},{id:'local-seed-cc',initials:'CC',name:'Clip Central',description:'Funny clips, Reels, and gaming moments.',category:'Entertainment'}];
 if(remoteMode&&db){const items=remoteCommunities||[];
  return pageHeading('Communities','Shared spaces for topics, projects and communities.','<button class="button button-primary button-small" data-action="create-community">＋ Create community</button>')+'<div class="community-filters"><span class="pill">'+items.length+' communities</span><span class="pill">'+items.filter(g=>g.role).length+' joined</span><span class="tiny muted">Synced with your account</span></div>'+
  (items.length?items.map(g=>'<article class="post-card community-card"><span class="avatar">'+escapeHtml(initials(g.name))+'</span><div class="community-info"><b>'+escapeHtml(g.name)+'</b><p>'+escapeHtml(g.description||'A community on Revenant.')+'</p><div class="community-meta"><span class="pill">'+escapeHtml(g.category||'General')+'</span><span class="pill">'+g.members+' members</span>'+(g.role?'<span class="pill">'+escapeHtml(g.role)+'</span>':'')+'</div></div><div class="community-button-stack">'+(g.role?'<button class="button button-primary button-small" data-action="open-community" data-id="'+escapeHtml(g.id)+'">Open ↗</button>'+(g.role==='owner'?'<span class="tiny muted">Owner</span>':'<button class="button button-small" data-action="leave-community" data-id="'+escapeHtml(g.id)+'">Leave</button>'):'<button class="button button-primary button-small" data-action="join-community" data-id="'+escapeHtml(g.id)+'">Join</button>')+'</div></article>').join(''):'<div class="empty-state"><strong>No communities yet</strong>Create the first shared community.</div>')+'<p class="demo-notice">Cloud communities are shared through Supabase. The moderation system is intentionally left for the operator.</p>';
 }
 const locals=(Array.isArray(state.communities)?state.communities:[]).map(g=>({...g,initials:initials(g.name)}));
 const groups=seeded.concat(locals),joined=Array.isArray(state.joinedCommunities)?state.joinedCommunities:[];
 return pageHeading('Communities','Browse sample spaces or create a local demo.','<button class="button button-primary button-small" data-action="create-community">＋ Create</button>')+'<div class="community-filters"><span class="pill">'+groups.length+' communities</span><span class="pill">'+joined.length+' joined</span><span class="tiny muted">Local demo memberships</span></div>'+
 groups.map(g=>{const isJoined=joined.includes(g.name);return '<article class="post-card community-card"><span class="avatar">'+escapeHtml(g.initials)+'</span><div class="community-info"><b>'+escapeHtml(g.name)+'</b><p>'+escapeHtml(g.description||'A community on Revenant.')+'</p><div class="community-meta"><span class="pill">'+escapeHtml(g.category||'General')+'</span><span class="pill">Local preview</span></div></div><div class="community-button-stack">'+(isJoined?'<button class="button button-primary button-small" data-action="open-community" data-id="'+escapeHtml(g.id)+'">Open ↗</button>':'<button class="button button-primary button-small" data-action="join-community" data-id="'+escapeHtml(g.id)+'" data-name="'+escapeHtml(g.name)+'">Join</button>')+'</div></article>'}).join('')+'<p class="demo-notice">Local demo memberships stay in this browser. Connect Supabase for shared communities.</p>';
}
function renderCommunityPage(){
 const seeds=[{id:'local-seed-pw',name:'Pixel Workshop',description:'Art, sprites, fan art, and tiny worlds.',category:'Art & design'},{id:'local-seed-id',name:'Indie Dev Corner',description:'Build logs, coding questions, and game prototypes.',category:'Technology'},{id:'local-seed-mc',name:'Minecraft & Mods',description:'Modpacks, builds, technical help, and survival stories.',category:'Gaming'},{id:'local-seed-cc',name:'Clip Central',description:'Funny clips, Reels, and gaming moments.',category:'Entertainment'}];
 const group=remoteMode?remoteCommunities.find(g=>g.id===activeCommunityId):((state.communities||[]).concat(seeds)).find(g=>g.id===activeCommunityId);
 if(!group)return pageHeading('Community','Select a community to open.')+'<a class="button button-primary" href="#/communities">Back to communities</a>';
 const joined=remoteMode?!!group.role:(state.joinedCommunities||[]).includes(group.name);
 const posts=remoteMode?activeCommunityPosts:state.posts.filter(p=>String(p.community_id||'')===String(activeCommunityId));
 const composerBlock=joined?composer():'<section class="panel" style="padding:16px"><p class="muted small">Join this community to publish community posts.</p><button class="button button-primary button-small" data-action="join-community" data-id="'+escapeHtml(group.id)+'" data-name="'+escapeHtml(group.name)+'">Join community</button></section>';
 return pageHeading(escapeHtml(group.name),escapeHtml(group.description||'Community discussions and shared posts.'),'<a class="button button-small" href="#/communities">All communities</a>')+'<section class="panel community-hero"><div class="eyebrow">'+escapeHtml(group.category||'COMMUNITY')+'</div><h2>'+escapeHtml(group.name)+'</h2><p>'+escapeHtml(group.description||'A place for people to share and discuss.')+'</p><span class="pill">'+(remoteMode?group.members||0:1)+' members</span> <span class="pill">'+(joined?'MEMBER':'PUBLIC')+'</span></section>'+composerBlock+'<div class="section-heading">Community posts <span class="pill">'+posts.length+'</span></div>'+(posts.length?posts.map(p=>renderPost(p,commentsOpen.has(String(p.id)))).join(''):'<div class="empty-state"><strong>No posts here yet</strong>Start the first discussion in this community.</div>');
}

async function searchMessagePeople(query){
 if(!(remoteMode&&db&&user)){messageSearchResults=[];renderApp();return}
 const q=String(query||'').trim().replace(/[%_,]/g,'');if(q.length<2){messageSearchResults=[];renderApp();return}
 const {data,error}=await db.from('profiles').select('id,username,avatar_url,bio').ilike('username','%'+q+'%').neq('id',user.id).limit(12);
 if(error)throw error;messageSearchResults=data||[];renderApp();
}
async function refreshMessageThreads(){
 if(!(remoteMode&&db&&user))return;
 const {data,error}=await db.from('direct_messages').select('id,sender_id,recipient_id,body,created_at,read_at').or('sender_id.eq.'+user.id+',recipient_id.eq.'+user.id).order('created_at',{ascending:false}).limit(400);
 if(error)throw error;const rows=data||[],latest=new Map();
 rows.forEach(m=>{const peer=m.sender_id===user.id?m.recipient_id:m.sender_id;if(!latest.has(peer)){const same=rows.filter(x=>(x.sender_id===user.id?x.recipient_id:x.sender_id)===peer);latest.set(peer,{peer_id:peer,last:m,unread:same.filter(x=>x.sender_id===peer&&x.recipient_id===user.id&&!x.read_at).length})}});
 const ids=Array.from(latest.keys());let byId={};
 if(ids.length){const result=await db.from('profiles').select('id,username,avatar_url,bio').in('id',ids);if(result.error)throw result.error;(result.data||[]).forEach(p=>byId[p.id]=p)}
 messageThreads=Array.from(latest.values()).map(t=>({...t,profile:byId[t.peer_id]||{id:t.peer_id,username:'Member'}})).sort((x,y)=>new Date(y.last.created_at)-new Date(x.last.created_at));
}
async function refreshMessageHistory(){
 if(!(remoteMode&&db&&user&&activeMessagePeer))return;const peer=activeMessagePeer.id;
 const {data,error}=await db.from('direct_messages').select('id,sender_id,recipient_id,body,created_at,read_at').or('sender_id.eq.'+user.id+',recipient_id.eq.'+user.id).order('created_at',{ascending:true}).limit(500);
 if(error)throw error;messageHistory=(data||[]).filter(m=>(m.sender_id===user.id?m.recipient_id:m.sender_id)===peer);
 const unread=messageHistory.filter(m=>m.sender_id===peer&&m.recipient_id===user.id&&!m.read_at).map(m=>m.id);
 if(unread.length){const stamp=new Date().toISOString();const result=await db.from('direct_messages').update({read_at:stamp}).in('id',unread);if(result.error)console.warn('Read receipt could not be saved',result.error);messageHistory=messageHistory.map(m=>unread.includes(m.id)?({...m,read_at:stamp}):m)}
}
async function openMessageThread(id,name){
 if(!(remoteMode&&db&&user)){toast('Direct messages require a signed-in Supabase account.');return}
 if(!id||id===user.id){toast('You cannot open a conversation with yourself.');return}
 activeMessagePeer=messageSearchResults.find(p=>p.id===id)||messageThreads.find(t=>t.peer_id===id)?.profile||{id,username:name||'Member'};
 navigate('/messages');await refreshMessageHistory();await refreshMessageThreads();renderApp();
}
async function sendMessage(form){
 if(!(remoteMode&&db&&user)){toast('Connect Supabase and sign in to send real messages.');return}
 if(!activeMessagePeer){toast('Choose a conversation first.');return}
 const body=String(new FormData(form).get('message')||'').trim();if(!body)return;if(body.length>2000){toast('Messages are limited to 2,000 characters.');return}
 const {error}=await db.from('direct_messages').insert({sender_id:user.id,recipient_id:activeMessagePeer.id,body});
 if(error)throw error;form.reset();await refreshMessageHistory();await refreshMessageThreads();renderApp();
}
function renderMessages(){
 if(!(remoteMode&&db&&user))return pageHeading('Messages','Private conversations require a configured shared account.','<span class="pill">SETUP REQUIRED</span>')+'<section class="panel" style="padding:22px"><h2>Real messaging is available in shared mode.</h2><p class="muted small">Set up Supabase using the 0.05 schema, configure config.js, and sign in. Local demo mode does not send private messages between people.</p><a class="button button-primary button-small" href="#/settings">Open backend settings ↗</a></section>';
 const peer=activeMessagePeer;
 const threads=messageThreads.length?messageThreads.map(t=>'<button class="dm-thread '+(peer&&peer.id===t.peer_id?'active':'')+'" data-action="open-thread" data-user-id="'+escapeHtml(t.peer_id)+'" data-user-name="'+escapeHtml(t.profile.username||'Member')+'">'+renderAvatar(t.profile.username,'',t.profile.avatar_url)+'<span class="dm-thread-text"><b>'+escapeHtml(t.profile.username||'Member')+'</b><small>'+escapeHtml(t.last.body||'')+'</small><small class="muted">'+formatTime(t.last.created_at)+'</small></span>'+(t.unread?'<span class="pill">'+t.unread+'</span>':'')+'</button>').join(''):'<div class="safety-empty">No conversations yet. Search for a username to start one.</div>';
 const found=messageSearchResults.length?'<div class="dm-search-results">'+messageSearchResults.map(p=>'<div class="dm-person">'+renderAvatar(p.username,'',p.avatar_url)+'<span><b>'+escapeHtml(p.username)+'</b><small>'+escapeHtml(p.bio||'Revenant member')+'</small></span><button class="button button-small button-primary" data-action="start-message" data-user-id="'+escapeHtml(p.id)+'" data-user-name="'+escapeHtml(p.username)+'">Message</button></div>').join('')+'</div>':'';
 const conversation=peer?'<div class="dm-current-heading">'+renderAvatar(peer.username,'',peer.avatar_url)+'<span><b>'+escapeHtml(peer.username||'Member')+'</b><small>Private conversation</small></span></div><div class="dm-history">'+(messageHistory.length?messageHistory.map(m=>'<div class="dm-bubble-wrap '+(m.sender_id===user.id?'mine':'theirs')+'"><div class="dm-bubble">'+escapeHtml(m.body)+'</div><small>'+formatTime(m.created_at)+(m.sender_id===user.id&&m.read_at?' · Read':'')+'</small></div>').join(''):'<div class="safety-empty">Say hello to start the conversation.</div>')+'</div><form id="dm-send-form" class="dm-send-form"><textarea name="message" rows="2" maxlength="2000" required placeholder="Write a private message…"></textarea><button class="button button-primary" type="submit">Send ↗</button></form>':'<div class="dm-empty"><div class="empty-icon">✉</div><strong>Select a conversation</strong><p>Pick someone from your inbox or search a username above.</p></div>';
 return pageHeading('Messages','Private, persistent conversations with signed-in Revenant members.','<span class="pill">LIVE IN SHARED MODE</span>')+'<form id="messages-search-form" class="explore-search"><input id="messages-user-query" maxlength="60" placeholder="Find someone by username…" aria-label="Search people to message"><button type="submit" class="button button-primary">Find people ↗</button></form>'+found+'<div class="dm-layout"><aside class="dm-inbox"><div class="panel-heading">Inbox <button class="button button-small" data-action="refresh-messages">Refresh</button></div>'+threads+'</aside><section class="dm-conversation">'+conversation+'</section></div><p class="demo-notice">Messages use participant-only database policies but are not end-to-end encrypted. The moderation system is intentionally left for the operator.</p>';
}
function applyTheme(){
 const palette={red:'#e02c40',purple:'#a855f7',blue:'#4285f4',green:'#52c78b'};
 const accent=palette[state.theme]||palette.red;
 document.documentElement.style.setProperty('--red',accent);
 document.documentElement.style.setProperty('--red2',state.theme==='red'?'#a91628':accent);
}

function renderApp() {
 if(!profile&&!state.profile){showGate(db?'auth':'profile');return}
 updateHeader();
 currentRoute=routeFromHash();
 $$('.nav-link,.mobile-nav a[data-route]').forEach(a=>a.classList.toggle('active',a.getAttribute('data-route')===currentRoute));
 const main=$('#main-content');
 if(currentRoute==='/home')main.innerHTML=renderHome();
 else if(currentRoute==='/feed')main.innerHTML=renderPosts(true);
 else if(currentRoute==='/posts')main.innerHTML=renderPosts(false);
 else if(currentRoute==='/explore')main.innerHTML=renderExplore();
 else if(currentRoute==='/saved')main.innerHTML=renderSaved();
 else if(currentRoute==='/notifications')main.innerHTML=renderNotifications();
 else if(currentRoute==='/drafts')main.innerHTML=renderDrafts();
 else if(currentRoute==='/reels')main.innerHTML=renderReels();
 else if(currentRoute==='/terms')main.innerHTML=renderTerms();
 else if(currentRoute==='/settings')main.innerHTML=renderSettings();
  else if(currentRoute==='/safety')main.innerHTML=renderSafetyCenter();
 else if(currentRoute==='/profile')main.innerHTML=renderProfile();
 else if(currentRoute==='/communities')main.innerHTML=renderCommunities();
 else if(currentRoute==='/community')main.innerHTML=renderCommunityPage();
 else if(currentRoute==='/messages')main.innerHTML=renderMessages();
 else if(currentRoute==='/privacy')main.innerHTML=renderPrivacyPolicy();
 else main.innerHTML=renderHelp();
 $('#main-content').focus({preventScroll:true});
 const notificationBadge=$('#notification-count');if(notificationBadge){const unread=(state.notifications||[]).filter(n=>n.unread).length;notificationBadge.textContent=unread;notificationBadge.classList.toggle('hidden',!unread)}
 const postBody=$('#post-body');if(postBody&&state.drafts&&state.drafts.postDraft&&postBody.value!==state.drafts.postDraft)postBody.value=state.drafts.postDraft;
 if($('#poll-builder'))$('#poll-builder').classList.toggle('hidden',composerMode!=='poll');
 $$('[data-action="set-post-type"]').forEach(b=>b.classList.toggle('active',b.getAttribute('data-type')===composerMode));
 applyTheme();
 document.body.classList.toggle('reduce-motion',!!state.reduceMotion);
}
function routeFromHash() {
 let p=(location.hash||'#/home').replace(/^#/,'').split('?')[0].toLowerCase();
 if(!p.startsWith('/'))p='/'+p;
 const known=['/home','/feed','/posts','/reels','/terms','/settings','/profile','/communities','/messages','/help','/upload','/explore','/saved','/notifications','/drafts','/safety','/community','/privacy'];
 return known.includes(p)?(p==='/upload'?'/posts':p):'/home';
}
const routes=new Set(['/home','/feed','/posts','/reels','/terms','/settings','/profile','/communities','/messages','/help','/upload','/explore','/saved','/notifications','/drafts','/safety','/community','/privacy']);
function navigate(path) {
 if(!routes.has(path)){toast('Unknown destination. Try /home, /feed, /posts, /reels, or /terms.');return}
 if(path==='/upload')path='/posts';
 if(location.hash==='#'+path) { renderApp(); return; }
 location.hash='#'+path;
}
function showGate(step, message='') {
 gateStep=step;
 const root=$('#gate-root');
 if(step==='done'||!step){root.innerHTML='';return}
 let body='';
 if(step==='age') {
  body='<div class="gate-brand"><span class="brand-mark">R</span><span><strong class="brand-name">REVENANT</strong><small>FORGEWARE 0.05</small></span></div><span class="eyebrow">BEFORE YOU ENTER</span><h1>First things first.</h1><p class="gate-copy">Revenant is intended for users aged 13 and older. Enter your birthday to continue.</p><form id="age-form"><label class="field-label" for="birthday">Your date of birth</label><input class="field" id="birthday" type="date" max="'+new Date().toISOString().slice(0,10)+'" required><div class="notice">This prototype checks the date you enter but does not verify your age. A public service needs appropriate age-safety and privacy measures.</div><button class="button button-primary button-block" type="submit">Continue →</button></form>';
 } else if(step==='welcome') {
  body='<div class="gate-brand"><span class="brand-mark">R</span><span><strong class="brand-name">REVENANT</strong><small>FORGEWARE 0.05</small></span></div><span class="eyebrow">BEFORE YOU ENTER</span><h1>Welcome to Reven.</h1><p class="gate-copy">We have a few rules. They’re short. Please take a moment to review them.</p><div class="rule-preview"><div>01&nbsp; No illegal content or exploitation.</div><div>02&nbsp; No credible threats, doxxing, or targeted harassment.</div><div>03&nbsp; No scams, malware, or account theft.</div><div>04&nbsp; Respect privacy. Be creative. Don’t abuse the platform.</div></div><a href="#/terms" class="button button-block" data-gate="read-terms">Read Terms of Service</a><div class="gate-actions"><button class="button button-primary" data-gate="agree">Agree & continue</button></div><p class="gate-footnote">This is the short community-rules summary. The real service needs full Terms of Service and Privacy Policy documents.</p>';
 } else if(step==='birch') {
  body='<div class="gate-brand"><span class="brand-mark">R</span><span><strong class="brand-name">REVENANT</strong><small>QUICK REALITY CHECK</small></span></div><div class="joke">Burch.</div><h1>Come on. You probably didn’t read that, did you?</h1><p class="gate-copy">Don’t worry, we made it short as hell for a reason.</p><div class="notice">No mind reading here. You agreed without opening the rules, so we’re sending you back to them.</div><button class="button button-primary button-block" data-gate="read-terms">Fine, show me the rules</button>';
 } else if(step==='terms') {
  body='<div class="gate-brand"><span class="brand-mark">R</span><span><strong class="brand-name">REVENANT</strong><small>THE SMALL PRINT. ACTUALLY SMALL.</small></span></div><span class="eyebrow">COMMUNITY RULES · V0.05</span><h1>The rules. All six.</h1>'+rulesMarkup(true)+'<button class="button button-primary button-block" style="margin-top:15px" data-gate="accept-terms">I reviewed the rules — continue</button><p class="gate-footnote">This is a prototype rules summary, not the complete legal Terms of Service or Privacy Policy.</p>';
 } else if(step==='auth') {
  body=renderAuthGate(message);
 } else if(step==='profile') {
  body='<div class="gate-brand"><span class="brand-mark">R</span><span><strong class="brand-name">REVENANT</strong><small>YOUR SPACE IS WAITING</small></span></div><h1>Make yourself at home.</h1><p class="gate-copy">Create a local demo profile to explore Forgeware 0.05. Without a backend connection, posts stay in this browser and aren’t shared with other users.</p><form id="local-profile-form"><label class="field-label" for="local-name">Choose a display name</label><input class="field" id="local-name" maxlength="24" required placeholder="e.g. PixelFox"><button type="submit" class="button button-primary button-block">Create demo profile</button></form><div class="gate-actions"><button class="button button-quiet" data-gate="quick-local">Quick setup — generate a name</button></div><p class="gate-footnote">This is a local prototype profile, not an online account.</p>';
 } else if(step==='local-credentials') {
  body='<div class="gate-brand"><span class="brand-mark">R</span><span><strong class="brand-name">REVENANT</strong><small>QUICK DEMO SETUP</small></span></div><span class="eyebrow">SAVE THESE DETAILS</span><h1>Your demo profile is ready.</h1><p class="gate-copy">Here is your generated username and demo password. The password is shown once and is not used to authenticate you; this profile exists only in this browser.</p><div class="credentials"><label>GENERATED USERNAME</label><code id="generated-demo-username">'+escapeHtml((pendingLocalProfile||{}).username||'')+'</code><label>GENERATED DEMO PASSWORD</label><code id="generated-demo-password">'+escapeHtml(generatedDemoPassword)+'</code></div><button class="button button-block" data-gate="copy-demo-credentials">Copy details</button><button class="button button-primary button-block" style="margin-top:9px" data-gate="enter-demo">Enter Revenant ↗</button><p class="gate-footnote">This is convenience for the prototype, not a real online account. Configure Supabase to use accounts and posts shared across devices.</p>';
 } else if(step==='under13') {
  body='<div class="gate-brand"><span class="brand-mark">R</span><span><strong class="brand-name">REVENANT</strong></span></div><h1>Not just yet.</h1><p class="gate-copy">Revenant is intended for ages 13 and up. Here’s a safer place for younger viewers.</p><button class="button button-primary button-block" data-gate="kids">Go to YouTube Kids ↗</button>';
 } else {
  body='<div class="gate-brand"><span class="brand-mark">R</span><span><strong class="brand-name">REVENANT</strong></span></div><h1>Loading Revenant…</h1><p class="gate-copy">Preparing your space.</p>';
 }
 root.innerHTML='<div class="gate"><section class="gate-card">'+body+'</section></div>';
 if(step==='auth')bindAuthTabs();
}
function renderAuthGate(message='') {
 const signup=authMode==='signup';
 return '<div class="gate-brand"><span class="brand-mark">R</span><span><strong class="brand-name">REVENANT</strong><small>FORGEWARE 0.05</small></span></div><span class="eyebrow">YOUR ACCOUNT</span><h1>'+(signup?'Join the conversation.':'Welcome back.')+'</h1><p class="gate-copy">'+(backendConfigured?'This connects to your Supabase project. Use an email address you can access for account confirmation and recovery.':'Backend is not configured yet. You can create a local demo profile, or configure Supabase to use real accounts and shared posts.')+'</p>'+(message?'<div class="notice">'+escapeHtml(message)+'</div>':'')+(backendConfigured?'<div class="gate-actions"><button class="button '+(signup?'button-primary':'')+'" data-gate="auth-signup">Create account</button><button class="button '+(!signup?'button-primary':'')+'" data-gate="auth-login">Sign in</button></div><form id="auth-form">'+(signup?'<label class="field-label" for="auth-username">Username</label><input id="auth-username" class="field" name="username" maxlength="24" pattern="[A-Za-z0-9_ -]{2,24}" required placeholder="PixelFox">':'')+'<label class="field-label" for="auth-email">Email</label><input id="auth-email" class="field" type="email" name="email" autocomplete="email" required placeholder="you@example.com"><label class="field-label" for="auth-password">Password</label><input id="auth-password" class="field" type="password" name="password" autocomplete="'+(signup?'new-password':'current-password')+'" minlength="10" required placeholder="At least 10 characters">'+(signup?'<div class="notice">Use a unique password. The full Terms and Privacy Policy must be ready before a public launch.</div>':'')+'<button class="button button-primary button-block" type="submit" style="margin-top:12px">'+(signup?'Create account':'Sign in')+'</button></form><div class="gate-actions"><button class="button button-quiet" data-gate="demo-profile">Try local demo instead</button></div>':'<button class="button button-primary button-block" data-gate="demo-profile">Create a local demo profile</button><p class="gate-footnote">To enable real accounts, set the Supabase project URL and publishable key in config.js and run the included SQL schema.</p>');
}
function bindAuthTabs(){/* delegated data-gate handlers keep the flow simple */}
function resetGateIfNeeded() {
 if(!storage.getItem(AGE_KEY)){showGate('age');return false}
 if(!storage.getItem(TERMS_KEY)){showGate('welcome');return false}
 return true;
}
async function ensureProfile(authUser, usernameHint='') {
 if(!db||!authUser)return null;
 const {data:existing,error:fetchErr}=await db.from('profiles').select('id,username,avatar_url,bio').eq('id',authUser.id).maybeSingle();
 if(fetchErr)throw fetchErr;
 if(existing){const {data:updated,error:updateError}=await db.from('profiles').update({terms_version:TERMS_VERSION,terms_accepted_at:new Date().toISOString()}).eq('id',authUser.id).select('id,username,avatar_url,bio,terms_version,terms_accepted_at').single();if(updateError)throw updateError;user=authUser;setProfile(updated);return updated}
 const hinted=usernameHint||authUser.user_metadata?.username||('member_'+authUser.id.slice(0,7));
 const clean=String(hinted).trim().replace(/[^A-Za-z0-9_ -]/g,'').slice(0,24)||('member_'+authUser.id.slice(0,7));
 const payload={id:authUser.id,username:clean,avatar_url:null,bio:'',terms_version:authUser.user_metadata?.terms_version||TERMS_VERSION,terms_accepted_at:authUser.user_metadata?.terms_accepted_at||new Date().toISOString()};
 let {data,error}=await db.from('profiles').insert(payload).select('id,username,avatar_url,bio,terms_version,terms_accepted_at').single();
 if(error&&error.code==='23505'){
  const fallback=('Revenant_'+authUser.id.replace(/-/g,'').slice(0,8)).slice(0,24);
  const retry=await db.from('profiles').insert({...payload,username:fallback}).select('id,username,avatar_url,bio,terms_version,terms_accepted_at').single();
  if(retry.error)throw retry.error;
  data=retry.data;error=null;toast('That username was already taken. We assigned '+fallback+' instead. You can change it in Settings.');
 }
 if(error)throw error;
 user=authUser;setProfile(data);return data;
}
async function refreshRemotePosts() {
 if(!db||!remoteMode)return;
 const {data:rows,error}=await db.from('posts').select('id,user_id,body,category,font_family,media_url,media_type,community_id,created_at,post_type,poll_data,profiles(username,avatar_url)').order('created_at',{ascending:false}).limit(60);
 if(error){console.error(error);toast('Could not load shared posts. Check your Supabase schema and policies.');return}
 const {data:likes,error:likesError}=await db.from('post_likes').select('post_id,user_id');
 if(!likesError){likedRemote.clear();const counts={};(likes||[]).forEach(l=>{counts[l.post_id]=(counts[l.post_id]||0)+1;if(user&&l.user_id===user.id)likedRemote.add(l.post_id)});remotePosts=(rows||[]).map(r=>({...r,name:r.profiles?.username||'Member',handle:userHandle(r.profiles?.username||'Member'),avatar_url:r.profiles?.avatar_url,likes_count:counts[r.id]||0,comments_count:0,comments:[]}));}
 else remotePosts=(rows||[]).map(r=>({...r,name:r.profiles?.username||'Member',handle:userHandle(r.profiles?.username||'Member'),avatar_url:r.profiles?.avatar_url,likes_count:0,comments_count:0,comments:[]}));
 const pollIds=remotePosts.filter(p=>p.post_type==='poll'&&p.poll_data&&Array.isArray(p.poll_data.options)).map(p=>p.id);
 if(pollIds.length){
  const {data:pollRows,error:pollErr}=await db.rpc('get_poll_results',{post_ids:pollIds});
  if(!pollErr){
   const pollCounts={},pollMine={};
   (pollRows||[]).forEach(v=>{if(!pollCounts[v.post_id])pollCounts[v.post_id]=[];pollCounts[v.post_id][v.option_index]=Number(v.vote_count||0);if(v.viewer_option!==null&&v.viewer_option!==undefined)pollMine[v.post_id]=Number(v.viewer_option)});
   remotePosts.forEach(p=>{if(p.post_type==='poll'&&p.poll_data&&Array.isArray(p.poll_data.options)){p.poll={options:p.poll_data.options,votes:p.poll_data.options.map((_,i)=>(pollCounts[p.id]||[])[i]||0),votedIndex:Object.prototype.hasOwnProperty.call(pollMine,p.id)?pollMine[p.id]:null}}});
  } else console.warn('Poll results are unavailable until the 0.05 schema is applied.',pollErr);
 }
 const {data:commentRows,error:commentError}=await db.from('comments').select('post_id');
 if(!commentError){const counts={};(commentRows||[]).forEach(c=>counts[c.post_id]=(counts[c.post_id]||0)+1);remotePosts.forEach(p=>p.comments_count=counts[p.id]||0)}
 if(user){const {data:savedRows,error:savedError}=await db.from('bookmarks').select('post_id').eq('user_id',user.id);if(!savedError)state.bookmarks=(savedRows||[]).map(row=>String(row.post_id));const {data:followRows,error:followError}=await db.from('follows').select('following_id').eq('follower_id',user.id);if(!followError)state.following=(followRows||[]).map(row=>String(row.following_id));}
 state.posts=remotePosts;
 renderApp();
}
async function refreshComments(postId) {
 if(!db||!remoteMode)return;
 const {data,error}=await db.from('comments').select('id,post_id,user_id,body,font_family,created_at,profiles(username,avatar_url)').eq('post_id',postId).order('created_at',{ascending:true}).limit(100);
 if(error){toast('Could not load replies. Check the database policies.');return}
 const p=state.posts.find(x=>String(x.id)===String(postId));if(!p)return;
 p.comments=(data||[]).map(c=>({id:c.id,name:c.profiles?.username||'Member',avatar_url:c.profiles?.avatar_url,body:c.body,font_family:c.font_family,created_at:c.created_at}));
 renderApp();
}
async function boot() {
 setProfile(state.profile);
 if(!resetGateIfNeeded())return;
 if(db) {
  try {
   const {data,error}=await db.auth.getSession();
   if(error)throw error;
   if(data.session) {
    user=data.session.user;remoteMode=true;
    try {await ensureProfile(user)} catch(err) { console.error(err);showGate('auth','You are signed in, but your profile table is not ready. Run supabase-schema.sql in your project.');return; }
    await refreshRemotePosts();
    showGate('');renderApp();
    return;
   }
  } catch(err) {console.error(err);showGate('auth','Backend connection failed. Verify config.js and your Supabase project.');return;}
  authMode='signup';showGate('auth');return;
 }
 if(state.profile) {setProfile(state.profile);remoteMode=false;state.posts=Array.isArray(state.posts)?state.posts:demoSeeds;showGate('');renderApp();return}
 showGate('profile');
}
async function finishAuth(sessionUser, username) {
 user=sessionUser;remoteMode=true;
 await ensureProfile(sessionUser,username);
  await refreshSafetyControls();
 await refreshRemoteCommunities();await refreshNotifications();await startRealtimeSubscriptions();
 showGate('');await refreshRemotePosts();navigate('/home');renderApp();
}
async function submitAuth(form) {
 const formData=new FormData(form);
 const email=String(formData.get('email')||'').trim();
 const password=String(formData.get('password')||'');
 if(!db){showGate('profile');return}
 if(authMode==='signup') {
  const username=String(formData.get('username')||'').trim();
  if(username.length<2){toast('Username must be at least two characters.');return}
  const {data,error}=await db.auth.signUp({email,password,options:{data:{username,terms_version:TERMS_VERSION,terms_accepted_at:new Date().toISOString()}}});
  if(error)throw error;
  if(data.session&&data.user){await finishAuth(data.user,username)}
  else showGate('auth','Account request submitted. Check your email for a confirmation link, then return here and sign in.');
 } else {
  const {data,error}=await db.auth.signInWithPassword({email,password});
  if(error)throw error;
  if(data.user)await finishAuth(data.user);
 }
}


async function refreshNotifications(){
 if(!(remoteMode&&db&&user))return;
 const {data,error}=await db.from('notifications').select('id,actor_id,event_type,entity_id,body,read_at,created_at').eq('recipient_id',user.id).order('created_at',{ascending:false}).limit(80);
 if(error)throw error;
 state.notifications=(data||[]).map(n=>({id:n.id,type:n.event_type==='like'?'like':n.event_type==='comment'?'comment':n.event_type==='follow'?'follow':n.event_type==='message'?'message':'system',title:({like:'New like',comment:'New reply',follow:'New follower',message:'New message'}[n.event_type]||'Revenant activity'),body:n.body||'You have new activity.',time:formatTime(n.created_at),unread:!n.read_at,created_at:n.created_at}));saveLocal();
}
async function startRealtimeSubscriptions(){
 if(!(remoteMode&&db&&user))return;
 if(realtimeChannel){try{await db.removeChannel(realtimeChannel)}catch(_){}}
 realtimeChannel=db.channel('revenant-live-'+user.id)
 .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'recipient_id=eq.'+user.id},async()=>{try{await refreshNotifications();if(routeFromHash()==='/notifications')renderApp();toast('New activity on Revenant.')}catch(err){console.warn(err)}})
 .on('postgres_changes',{event:'INSERT',schema:'public',table:'direct_messages',filter:'recipient_id=eq.'+user.id},async payload=>{try{await refreshMessageThreads();if(activeMessagePeer&&activeMessagePeer.id===payload.new.sender_id){await refreshMessageHistory();renderApp()}else if(routeFromHash()==='/messages')renderApp()}catch(err){console.warn(err)}})
 .on('postgres_changes',{event:'INSERT',schema:'public',table:'direct_messages',filter:'sender_id=eq.'+user.id},async payload=>{try{await refreshMessageThreads();if(activeMessagePeer&&activeMessagePeer.id===payload.new.recipient_id){await refreshMessageHistory();renderApp()}}catch(err){console.warn(err)}})
 .subscribe();
}

function addNotification(item){
 state.notifications=Array.isArray(state.notifications)?state.notifications:[];
 state.notifications.unshift({id:'note-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),type:'system',time:'Just now',unread:true,...item});
 state.notifications=state.notifications.slice(0,80);
}
function renderExplore(){
 const q=exploreQuery.trim().toLowerCase();
 let posts=state.posts.filter(p=>!isSuppressedPost(p)&&(!q||[p.body,p.text,p.name,p.handle,p.category,p.tag].join(' ').toLowerCase().includes(q)));
 if(exploreCategory!=='ALL')posts=posts.filter(p=>(p.category||p.tag||'GENERAL').toUpperCase()===exploreCategory);
 posts.sort((a,b)=>Number(b.likes_count||b.likes||0)-Number(a.likes_count||a.likes||0));
 const chips=['ALL','GAMING','ART & DESIGN','TECH','DISCUSSION','MEMES'];
 const peopleMarkup=remoteMode&&q?'<div class="section-heading">People <span class="pill">'+remoteSearchUsers.length+'</span></div>'+(remoteSearchUsers.length?remoteSearchUsers.map(p=>'<article class="post-card search-person">'+renderAvatar(p.username,'',p.avatar_url)+'<div class="community-info"><b>'+escapeHtml(p.username)+'</b><p>'+escapeHtml(p.bio||'Revenant member')+'</p></div><button class="button button-small button-primary" data-action="start-message" data-user-id="'+escapeHtml(p.id)+'" data-user-name="'+escapeHtml(p.username)+'">Message</button></article>').join(''):'<div class="safety-empty">No matching usernames.</div>'):'';
 const results=remoteMode&&q?remoteSearchPosts:posts;
 return pageHeading('Explore','Search public posts and find members across Revenant.','<span class="pill">DISCOVER</span>')+'<form id="explore-form" class="explore-search"><input id="explore-query" maxlength="100" value="'+escapeHtml(exploreQuery)+'" placeholder="Search posts, people, topics…" aria-label="Search Revenant"><button class="button button-primary" type="submit">Search ↗</button></form>'+peopleMarkup+'<div class="topic-chips">'+chips.map(t=>'<button type="button" class="'+(exploreCategory===t?'active':'')+'" data-action="explore-category" data-category="'+t+'">'+t+'</button>').join('')+'</div><section class="panel" style="padding:14px;margin-bottom:14px"><div class="panel-heading">Trending topics <span class="accent">↗</span></div><div class="topic-chips"><button data-action="topic-search" data-topic="Minecraft">#Minecraft</button><button data-action="topic-search" data-topic="IndieGames">#IndieGames</button><button data-action="topic-search" data-topic="Pixel art">Pixel art</button><button data-action="topic-search" data-topic="web building">Web building</button></div><div class="tiny muted">Topic trends are illustrative in this prototype, not live global analytics.</div></section><div class="section-heading">'+(remoteMode&&q?'Matching public posts':'Results')+' <span class="pill">'+results.length+' posts</span></div>'+(results.length?results.map(p=>renderPost(p,commentsOpen.has(String(p.id)))).join(''):'<div class="empty-state"><div class="empty-icon">⌕</div><strong>No matching posts</strong>Try another phrase or change the category filter.</div>');
}
function renderSaved(){
 const ids=new Set((state.bookmarks||[]).map(String));
 const items=state.posts.filter(p=>!isSuppressedPost(p)&&ids.has(String(p.id)));
 return pageHeading('Saved','A personal reading list of posts you want to revisit.','<span class="pill">'+items.length+' SAVED</span>')+
 (items.length?items.map(p=>renderPost(p,commentsOpen.has(String(p.id)))).join(''):'<div class="empty-state"><div class="empty-icon">⌑</div><strong>Nothing saved yet</strong>Use Save on any post to collect it here.</div>');
}
function renderNotifications(){
 const items=Array.isArray(state.notifications)?state.notifications:[];
 return pageHeading('Notifications','Updates from your Revenant activity.','<button class="button button-small" data-action="mark-notifications-read">Mark all read</button>')+
 '<section class="panel" style="padding:8px 14px">'+(items.length?items.map(n=>'<div class="notification-row '+(n.unread?'unread':'')+'"><span class="notification-icon">'+({like:'♥',comment:'▱',follow:'＋',community:'♧',post:'↗',system:'✦'}[n.type]||'•')+'</span><div class="notification-copy"><strong>'+escapeHtml(n.title||'Update')+'</strong><p>'+escapeHtml(n.body||'')+'</p><span class="tiny muted">'+escapeHtml(n.time||'Recently')+'</span></div>'+(n.unread?'<span class="dot" title="Unread"></span>':'')+'</div>').join(''):'<div class="empty-state"><strong>You are all caught up.</strong>New activity will show here.</div>')+'</section><p class="demo-notice">These are local prototype notifications. Live notifications and push alerts are planned for a future version.</p>';
}
function renderDrafts(){
 const draft=(state.drafts||{}).postDraft||'';
 return pageHeading('Drafts','Continue writing without publishing yet.','<span class="pill">'+(draft.trim()?'1 SAVED DRAFT':'NO DRAFT')+'</span>')+
 (draft.trim()?'<section class="panel" style="padding:15px"><div class="panel-heading">Post draft <span class="tiny muted">Saved locally</span></div><div class="draft-preview">'+escapeHtml(draft)+'</div><div class="page-tools"><button class="button button-primary button-small" data-action="continue-draft">Continue editing</button><button class="button button-small" data-action="delete-draft">Delete draft</button></div></section>':'<div class="empty-state"><div class="empty-icon">▧</div><strong>No saved drafts</strong>Start a post and use Save draft, or type in the composer—the text autosaves locally.</div>');
}

function renderHelp(){
 const cmds=[['/home','Open the home dashboard'],['/feed','Browse the timeline'],['/posts','Create and browse text posts'],['/reels','Watch videos'],['/terms','Read the community rules'],['/privacy','Read the privacy notice'],['/settings','Profile, fonts and backend'],['/messages','Open direct messages'],['/communities','Browse shared communities'],['/community','Open the selected community'],['/profile','View your profile'],['/safety','Manage your block/mute controls']];
 return pageHeading('Command guide','Quick navigation for advanced users.')+'<section class="panel" style="padding:14px">'+cmds.map(c=>'<div class="topic-row"><div><b class="mono accent">'+c[0]+'</b><small>'+c[1]+'</small></div><button class="button button-small" data-command="'+c[0]+'">Run ↗</button></div>').join('')+'</section>';
}
async function publishPost(form) {
 const body=$('#post-body').value.trim();
 if(!body&&!selectedFile){toast('Write something or attach an image/video first.');return}
 const category=$('#post-category').value||'GENERAL';
 const font=$('#post-font').value||'standard';
 const pollOptions=composerMode==='poll'?['#poll-option-1','#poll-option-2','#poll-option-3','#poll-option-4'].map(sel=>($(sel)?.value||'').trim()).filter(Boolean):[];
 if(composerMode==='poll'&&pollOptions.length<2){toast('A poll needs at least two filled options.');return}
 if(composerMode==='poll'&&selectedFile){toast('Remove the attachment before publishing a poll.');return}
 let mediaUrl=null;
 let mediaType=selectedFile?selectedFile.type:null;
 if(selectedFile&&String(selectedFile.type||'').startsWith('video/')&&!remoteMode){toast('Video uploads require a configured Supabase account.');return}
 if(remoteMode&&db&&selectedFile) {
  if(!user){toast('Sign in to upload a shared attachment.');return}
  const path=user.id+'/'+crypto.randomUUID()+'-'+safeName(selectedFile.name);
  const {error:uploadError}=await db.storage.from('post-media').upload(path,selectedFile,{contentType:selectedFile.type,upsert:false});
  if(uploadError)throw uploadError;
  const {data}=db.storage.from('post-media').getPublicUrl(path);mediaUrl=data.publicUrl;
 } else if(!remoteMode&&selectedFile) {
  const data=await readAsDataURL(selectedFile);
  if(String(selectedFile.type||'').startsWith('video/')){toast('Video uploads require a configured Supabase account.');return}
  if(data.length>2_200_000){toast('That image is too large for local demo storage. Try a smaller file.');return}
  mediaUrl=data;
 }
 if(remoteMode&&db) {
  if(!user){toast('Sign in before publishing a shared post.');return}
  const postCommunityId=routeFromHash()==='/community'&&activeCommunityId?activeCommunityId:null;
  const payload={user_id:user.id,body,category,font_family:font,media_url:mediaUrl,media_type:mediaType,community_id:postCommunityId,post_type:composerMode==='poll'?'poll':'post',poll_data:composerMode==='poll'?{options:pollOptions}:null};
  const {error}=await db.from('posts').insert(payload).select('id').single();
  if(error)throw error;
  selectedFile=null;composerMode='post';state.drafts.postDraft='';saveLocal();await refreshRemotePosts();if(routeFromHash()==='/community')await refreshCommunityPosts();renderApp();toast(payload.post_type==='poll'?'Poll published to shared Revenant.':'Post published to shared Revenant.');return;
 }
 const postCommunityId=routeFromHash()==='/community'&&activeCommunityId?activeCommunityId:null;
 const p={id:'local-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name:(profile||state.profile||{}).username||'Visitor',handle:userHandle((profile||state.profile||{}).username||'Visitor'),created_at:new Date().toISOString(),category,body,font_family:font,likes_count:0,comments_count:0,comments:[],own:true,community_id:postCommunityId,post_type:composerMode==='poll'?'poll':'post',poll:composerMode==='poll'?{options:pollOptions,votes:pollOptions.map(()=>0),votedIndex:null}:null};
 if(selectedFile){p.attachmentData=mediaUrl;p.attachmentName=selectedFile.name}
 state.posts.unshift(p);state.posts=state.posts.slice(0,150);selectedFile=null;composerMode='post';state.drafts.postDraft='';addNotification({type:'post',title:'Your post is live',body:'Your new post was saved in this browser.',time:'Just now',unread:true});saveLocal();renderApp();toast(p.post_type==='poll'?'Poll published locally.':'Post saved in this browser.');
}

function readAsDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Could not read attachment.'));reader.readAsDataURL(file)})}
async function toggleLike(id) {
 if(remoteMode&&db&&user) {
  if(likedRemote.has(id)) {const {error}=await db.from('post_likes').delete().eq('post_id',id).eq('user_id',user.id);if(error)throw error;likedRemote.delete(id)}
  else {const {error}=await db.from('post_likes').insert({post_id:id,user_id:user.id});if(error)throw error;likedRemote.add(id)}
  await refreshRemotePosts();return;
 }
 const p=state.posts.find(x=>String(x.id)===String(id));if(!p)return;
 const liked=!!p.liked||likedSeed.has(id);
 p.liked=!liked;p.likes_count=Math.max(0,Number(p.likes_count||p.likes||0)+(liked?-1:1));
 if(liked)likedSeed.delete(id);else likedSeed.add(id);
 saveLocal();renderApp();
}
async function addComment(form) {
 const postId=form.getAttribute('data-comment-form');
 const input=$('input[name="comment"]',form);const body=(input?.value||'').trim();
 const style=$('[data-comment-font="'+CSS.escape(postId)+'"]');
 if(!body)return;
 if(remoteMode&&db&&user) {
  const {error}=await db.from('comments').insert({post_id:postId,user_id:user.id,body,font_family:style?.value||'standard'});
  if(error)throw error;
  await refreshRemotePosts();await refreshComments(postId);commentsOpen.add(String(postId));renderApp();toast('Reply published.');return;
 }
 const p=state.posts.find(x=>String(x.id)===String(postId));if(!p)return;
 p.comments=p.comments||[];p.comments.push({id:'comment-'+Date.now(),name:(profile||state.profile||{}).username||'Visitor',initials:initials((profile||state.profile||{}).username||'Visitor'),body,font_family:style?.value||'standard',created_at:new Date().toISOString()});
 p.comments_count=p.comments.length;commentsOpen.add(String(postId));saveLocal();renderApp();toast('Reply saved in this browser.');
}
async function saveBookmark(id) {
 if(remoteMode&&db&&user) {
  if(state.bookmarks.includes(id)) {const {error}=await db.from('bookmarks').delete().eq('post_id',id).eq('user_id',user.id);if(error)throw error;state.bookmarks=state.bookmarks.filter(x=>x!==id)}
  else {const {error}=await db.from('bookmarks').insert({post_id:id,user_id:user.id});if(error)throw error;state.bookmarks.push(id)}
 } else {
  if(state.bookmarks.includes(id))state.bookmarks=state.bookmarks.filter(x=>x!==id);else state.bookmarks.push(id);
  saveLocal();
 }
 renderApp();toast(state.bookmarks.includes(id)?'Saved to your collection.':'Removed from saved posts.');
}
function showModal(title, text, actionText='Close', action='close') {
 const root=$('#modal-root');
 root.innerHTML='<div class="modal-backdrop" data-action="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><h2>'+escapeHtml(title)+'</h2><p>'+escapeHtml(text)+'</p><div class="modal-actions"><button class="button button-primary" data-action="close-modal">'+escapeHtml(actionText)+'</button></div></section></div>';
}
function exportData() {
 const blob=new Blob([JSON.stringify({version:'Forgeware 0.05',exportedAt:new Date().toISOString(),profile:state.profile,blockedAccounts:state.blockedAccounts,mutedAccounts:state.mutedAccounts,reports:state.reports,posts:remoteMode?[]:state.posts,bookmarks:state.bookmarks},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='revenant-forgeware-004.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Demo data exported.');
}
async function resetDemo() {
 if(!confirm('Reset the local demo posts, profile, and settings? This cannot be undone.'))return;
 storage.removeItem(STATE_KEY);state.profile=null;state.posts=demoSeeds.map(p=>({...p,comments:p.comments.map(c=>({...c}))}));state.bookmarks=[];state.likedLocal=[];state.blockedAccounts=[];state.mutedAccounts=[];state.reports=[];saveLocal();profile=null;showGate('profile');
}
function importFont(file) {
 if(!file)return;
 const ext=file.name.split('.').pop().toLowerCase();
 if(!['ttf','otf','woff','woff2'].includes(ext)){toast('Choose a .ttf, .otf, .woff, or .woff2 font file. ZIP import arrives later.');return}
 if(file.size>5_000_000){toast('Font files must be under 5 MB in this prototype.');return}
 const reader=new FileReader();
 reader.onload=async()=>{
  try {
   const face=new FontFace('Revenant Imported','url('+String(reader.result)+')');
   await face.load();document.fonts.add(face);customFontFace=face;customFontReady=true;importedFontName=file.name.replace(/\.[^.]+$/,'');
   toast('Font loaded for this browser session. Select Imported in a font menu.');
   if(routeFromHash()==='/settings')renderApp();
   else {const f=$('#post-font');if(f)f.innerHTML=fontOptions(f.value)}
  } catch(err){console.error(err);toast('This font could not be loaded by the browser. Check its format and licence.')}
 };
 reader.onerror=()=>toast('Could not read this font file.');
 reader.readAsDataURL(file);
}
document.addEventListener('click',async event=>{
 const gate=event.target.closest('[data-gate]');
 if(gate) {
  const action=gate.getAttribute('data-gate');
  try {
   if(action==='agree') { termsOpenedThisVisit=false;showGate('birch'); }
   else if(action==='read-terms') { termsOpenedThisVisit=true;showGate('terms'); }
   else if(action==='accept-terms') {
    storage.setItem(TERMS_KEY,JSON.stringify({version:TERMS_VERSION,acceptedAt:new Date().toISOString()}));
    if(db&&!user){const result=await db.auth.getSession();if(result.error)throw result.error;if(result.data.session){user=result.data.session.user;remoteMode=true;await ensureProfile(user);gateStep='';showGate('');await refreshRemotePosts();navigate('/home');renderApp()}else{authMode='signup';showGate('auth')}}
    else if(db&&user){const acceptedAt=new Date().toISOString();const {error:termsError}=await db.from('profiles').update({terms_version:TERMS_VERSION,terms_accepted_at:acceptedAt}).eq('id',user.id);if(termsError)throw termsError;gateStep='';showGate('');navigate('/home');renderApp()}
    else showGate('profile');
   }
   else if(action==='auth-signup'){authMode='signup';showGate('auth')}
   else if(action==='auth-login'){authMode='login';showGate('auth')}
   else if(action==='demo-profile')showGate('profile');
   else if(action==='quick-local'){const name='Reven_'+Math.random().toString(36).slice(2,7);pendingLocalProfile={username:name,initials:initials(name)};generatedDemoPassword=makeDemoPassword();showGate('local-credentials')}
   else if(action==='copy-demo-credentials'){const text='Username: '+((pendingLocalProfile||{}).username||'')+'\nDemo password: '+generatedDemoPassword;if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);toast('Demo details copied.')}else toast('Clipboard unavailable; select and copy the details manually.')}
   else if(action==='enter-demo'){state.profile=pendingLocalProfile||{username:'Reven_'+Math.random().toString(36).slice(2,7),initials:'R'};pendingLocalProfile=null;generatedDemoPassword='';saveLocal();setProfile(state.profile);gateStep='';showGate('');navigate('/home');renderApp()}
   else if(action==='kids')location.href='https://www.youtubekids.com/';
  } catch(err){console.error(err);toast(err.message||'Something went wrong.')}
  return;
 }
 const routeEl=event.target.closest('[data-route]');
 if(routeEl){event.preventDefault();navigate(routeEl.getAttribute('data-route'));return}
 const cmd=event.target.closest('[data-command]');
 if(cmd){navigate(cmd.getAttribute('data-command'));return}
 const btn=event.target.closest('[data-action]');
 if(btn) {
  const action=btn.getAttribute('data-action'),id=btn.getAttribute('data-id');
  try {
   if(action==='focus-compose'){navigate('/posts');setTimeout(()=>$('#post-body')?.focus(),70);return}
    if(action==='report-post'){const p=state.posts.find(x=>String(x.id)===String(id));if(!p){toast('Post not found.');return}showReportReasons(id,btn.getAttribute('data-user-key')||'',btn.getAttribute('data-user-name')||p.name||'Member');return}
    if(action==='report-reason'){const reason=btn.getAttribute('data-reason')||'Other';const details=prompt('Optional details for the report (do not include private information):','');if(details===null)return;await submitContentReport(id,btn.getAttribute('data-user-key')||'',btn.getAttribute('data-user-name')||'Member',reason,details);$('#modal-root').innerHTML='';return}
    if(action==='block-user'||action==='mute-user'){await toggleSafetyControl(action==='block-user'?'block':'mute',btn.getAttribute('data-user-key')||'',btn.getAttribute('data-user-name')||'Member');$('#modal-root').innerHTML='';return}
    if(action==='remove-safety-control'){await toggleSafetyControl(btn.getAttribute('data-kind')||'block',btn.getAttribute('data-user-key')||'',btn.getAttribute('data-user-name')||'Member');return}
   if(action==='set-post-type'){composerMode=btn.getAttribute('data-type')==='poll'?'poll':'post';const builder=$('#poll-builder');if(builder)builder.classList.toggle('hidden',composerMode!=='poll');$$('[data-action="set-post-type"]').forEach(b=>b.classList.toggle('active',b.getAttribute('data-type')===composerMode));if(composerMode==='poll')toast('Add a question and at least two poll options.');return}
   if(action==='save-draft'){state.drafts=state.drafts||{};state.drafts.postDraft=$('#post-body')?.value||'';saveLocal();toast(state.drafts.postDraft.trim()?'Draft saved in this browser.':'Draft cleared.');return}
   if(action==='continue-draft'){navigate('/posts');setTimeout(()=>$('#post-body')?.focus(),60);return}
   if(action==='delete-draft'){state.drafts.postDraft='';saveLocal();renderApp();toast('Draft deleted.');return}
   if(action==='explore-category'){exploreCategory=btn.getAttribute('data-category')||'ALL';renderApp();return}
   if(action==='topic-search'){exploreQuery=btn.getAttribute('data-topic')||'';exploreCategory='ALL';navigate('/explore');return}
   if(action==='mark-notifications-read'){if(remoteMode&&db&&user){const {error}=await db.from('notifications').update({read_at:new Date().toISOString()}).eq('recipient_id',user.id).is('read_at',null);if(error)throw error;await refreshNotifications()}else state.notifications=(state.notifications||[]).map(n=>({...n,unread:false}));saveLocal();renderApp();toast('Notifications marked as read.');return}
   if(action==='poll-vote'){
    const post=state.posts.find(x=>String(x.id)===String(id));const option=Number(btn.getAttribute('data-option'));const poll=post&&(post.poll||(post.poll_data?{options:post.poll_data.options||[],votes:post.poll_votes||[],votedIndex:post.voted_index}:null));
    if(!post||!poll||!Number.isInteger(option)||option<0||option>=poll.options.length){toast('This poll is unavailable.');return}
    if(Number.isInteger(poll.votedIndex)){toast('You have already voted in this poll.');return}
    if(remoteMode&&db&&user){const {error}=await db.from('poll_votes').insert({post_id:id,user_id:user.id,option_index:option});if(error)throw error;await refreshRemotePosts();toast('Vote recorded.');return}
    poll.votes=Array.isArray(poll.votes)?poll.votes:poll.options.map(()=>0);poll.votes[option]=(poll.votes[option]||0)+1;poll.votedIndex=option;state.pollVotes.push({post_id:id,option_index:option});saveLocal();renderApp();toast('Vote recorded locally.');return
   }
   if(action==='repost'){
    const original=state.posts.find(x=>String(x.id)===String(id));if(!original)return;
    const body='↻ Reposted from '+(original.name||'a member')+':\n\n'+(original.body||original.text||'');
    if(remoteMode&&db&&user){const {error}=await db.from('posts').insert({user_id:user.id,body,category:original.category||original.tag||'GENERAL',font_family:original.font_family||'standard',post_type:'post',poll_data:null,media_url:null});if(error)throw error;await refreshRemotePosts();toast('Repost published.');return}
    state.posts.unshift({id:'repost-'+Date.now(),name:(profile||state.profile||{}).username||'Visitor',handle:userHandle((profile||state.profile||{}).username||'Visitor'),created_at:new Date().toISOString(),category:original.category||original.tag||'GENERAL',body,font_family:'standard',likes_count:0,comments_count:0,comments:[],own:true,repost_of:id});saveLocal();renderApp();toast('Reposted to your local feed.');return
   }
   if(action==='create-community'){
    const name=prompt('Name your community (2–32 characters):');if(!name||name.trim().length<2)return;
    state.communities=Array.isArray(state.communities)?state.communities:[];const communityId='local-community-'+Date.now();state.communities.unshift({id:communityId,name:name.trim().slice(0,32),description:'A new community created in this browser.',category:'COMMUNITY',members:1});
    state.joinedCommunities.push(name.trim().slice(0,32));saveLocal();renderApp();toast('Community created locally.');return
   }
   if(action==='join-community'){
    const name=btn.getAttribute('data-name')||'Community';state.joinedCommunities=Array.isArray(state.joinedCommunities)?state.joinedCommunities:[];
    if(state.joinedCommunities.includes(name)){state.joinedCommunities=state.joinedCommunities.filter(x=>x!==name);toast('Left '+name+'.')}else{state.joinedCommunities.push(name);addNotification({type:'community',title:'Joined '+name,body:'You can find this community in your local joined list.',unread:true});toast('Joined '+name+'.')}
    saveLocal();renderApp();return
   }
   if(action==='follow-user'){
    if(remoteMode&&db&&user){
     if(state.following.includes(String(id))){const {error}=await db.from('follows').delete().eq('follower_id',user.id).eq('following_id',id);if(error)throw error;state.following=state.following.filter(x=>String(x)!==String(id));toast('Unfollowed account.')}
     else {const {error}=await db.from('follows').insert({follower_id:user.id,following_id:id});if(error)throw error;state.following.push(String(id));toast('Following account.')}
     saveLocal();renderApp();return;
    }
    state.following=Array.isArray(state.following)?state.following:[];
    if(state.following.includes(String(id))){state.following=state.following.filter(x=>String(x)!==String(id));toast('Unfollowed account.')}
    else {state.following.push(String(id));addNotification({type:'follow',title:'Following '+String(id),body:'Their posts can now appear in your Feed.',unread:true});toast('Following account.')}
    saveLocal();renderApp();return;
   }
   if(action==='like'){await toggleLike(id);return}
   if(action==='comments'){if(commentsOpen.has(String(id)))commentsOpen.delete(String(id));else commentsOpen.add(String(id));renderApp();if(remoteMode&&commentsOpen.has(String(id)))await refreshComments(id);return}
   if(action==='share'){const p=state.posts.find(x=>String(x.id)===String(id));const text=p?(p.body||p.text||'')+' — Revenant':'';if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);toast('Post text copied. Shareable public URLs come later.')}else toast('Clipboard not available in this browser.');return}
   if(action==='bookmark'){await saveBookmark(id);return}
   if(action==='post-menu'){const p=state.posts.find(x=>String(x.id)===String(id));if(remoteMode&&user&&p?.user_id===user.id){if(confirm('Delete this post?')){const {error}=await db.from('posts').delete().eq('id',id).eq('user_id',user.id);if(error)throw error;await refreshRemotePosts();toast('Post deleted.')}}else if(!remoteMode&&p?.own){if(confirm('Delete this local demo post?')){state.posts=state.posts.filter(x=>String(x.id)!==String(id));saveLocal();renderApp()}}else showPostOptions(p);return}
   if(action==='reel-next'){currentReel=(currentReel+1)%reels.length;renderApp();return}
   if(action==='reel-prev'){currentReel=(currentReel+reels.length-1)%reels.length;renderApp();return}
   if(action==='reel-like'){state.likedReels=state.likedReels||[];state.likedReels.includes(currentReel)?state.likedReels=state.likedReels.filter(i=>i!==currentReel):state.likedReels.push(currentReel);saveLocal();renderApp();return}
   if(action==='reel-comment'){toast('Reel comments will be connected when real video posts are added.');return}
   if(action==='reel-share'){toast('Reel share links are planned for a later version.');return}
   if(action==='start-message'||action==='open-thread'){await openMessageThread(btn.getAttribute('data-user-id')||'',btn.getAttribute('data-user-name')||'Member');return}
   if(action==='refresh-messages'){await refreshMessageThreads();if(activeMessagePeer)await refreshMessageHistory();renderApp();return}
   if(action==='create-community'){
    const name=(prompt('Community name (2–40 characters):')||'').trim();if(name.length<2){if(name.length)toast('Use at least two characters.');return}
    const description=(prompt('Short description (optional, up to 240 characters):')||'').trim().slice(0,240);
    const category=(prompt('Category (Gaming, Art, Technology, Discussion, General):','General')||'General').trim().slice(0,30);
    if(remoteMode&&db&&user){const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,45)+'-'+Math.random().toString(36).slice(2,6);const {error}=await db.from('communities').insert({name:name.slice(0,40),slug,description,category,created_by:user.id});if(error)throw error;await refreshRemoteCommunities();renderApp();toast('Community created and saved to Revenant.');return}
    state.communities=Array.isArray(state.communities)?state.communities:[];const newId='local-community-'+Date.now();state.communities.unshift({id:newId,name,description,category,members:1});state.joinedCommunities.push(name);activeCommunityId=newId;saveLocal();navigate('/community');toast('Community created in this browser.');return;
   }
   if(action==='open-community'){activeCommunityId=btn.getAttribute('data-id')||'';activeCommunityPosts=[];navigate('/community');if(remoteMode&&db)await refreshCommunityPosts();else renderApp();return}
   if(action==='join-community'){
    const id=btn.getAttribute('data-id')||'',name=btn.getAttribute('data-name')||(state.communities||[]).find(g=>g.id===id)?.name||'Community';
    if(remoteMode&&db&&user){const {error}=await db.from('community_members').insert({community_id:id,member_id:user.id,role:'member'});if(error&&error.code!=='23505')throw error;await refreshRemoteCommunities();renderApp();toast('Joined community.');return}
    state.joinedCommunities=Array.isArray(state.joinedCommunities)?state.joinedCommunities:[];if(!state.joinedCommunities.includes(name))state.joinedCommunities.push(name);saveLocal();renderApp();toast('Joined local community.');return;
   }
   if(action==='leave-community'){
    const id=btn.getAttribute('data-id')||'',group=remoteCommunities.find(g=>g.id===id);if(group?.role==='owner'){toast('Community owners cannot leave their own community yet.');return}
    if(remoteMode&&db&&user){const {error}=await db.from('community_members').delete().eq('community_id',id).eq('member_id',user.id);if(error)throw error;await refreshRemoteCommunities();renderApp();toast('Left community.');return}
    const localGroup=(state.communities||[]).find(g=>g.id===id);if(localGroup)state.joinedCommunities=state.joinedCommunities.filter(x=>x!==localGroup.name);saveLocal();renderApp();return;
   }
   if(action==='signout'){if(db){await db.auth.signOut()}user=null;profile=null;remoteMode=false;showGate('auth');return}
   if(action==='open-auth'){authMode='login';showGate(db?'auth':'profile');return}
   if(action==='reset-onboarding'){storage.removeItem(AGE_KEY);storage.removeItem(TERMS_KEY);showGate('age');return}
   if(action==='close-modal'||action==='modal-backdrop'){if(action==='modal-backdrop'&&event.target!==btn)return;$('#modal-root').innerHTML='';return}
  } catch(err){console.error(err);toast(err.message||'That action failed. Check the backend configuration.')}
 }
 if(event.target.id==='account-button')navigate('/settings');
 if(event.target.id==='open-font-import')$('#font-upload')?.click();
 if(event.target.id==='save-profile') {
  const input=$('#profile-name');const bioInput=$('#profile-bio');const username=(input?.value||'').trim();const bio=(bioInput?.value||'').trim().slice(0,280);
  if(username.length<2){toast('Display name must have at least two characters.');return}
  try{
   if(remoteMode&&db&&user){const {data,error}=await db.from('profiles').update({username,bio}).eq('id',user.id).select('id,username,avatar_url,bio').single();if(error)throw error;setProfile(data)}
   else {state.profile={...(state.profile||{}),username,bio,initials:initials(username)};saveLocal();setProfile(state.profile)}
   renderApp();toast('Profile updated.');
  }catch(err){console.error(err);toast(err.message||'Could not update profile.')}
 }
 if(event.target.id==='export-data')exportData();
 if(event.target.id==='reset-demo')resetDemo();
 if(event.target.id==='copy-generated') {
  const fields=[$('#generated-username')?.textContent,$('#generated-password')?.textContent].filter(Boolean).join('\n');
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(fields);toast('Copied.')};return;
 }
});
document.addEventListener('submit',async event=>{
 const form=event.target;
 try {
  if(form.id==='explore-form'){
   event.preventDefault();exploreQuery=$('#explore-query')?.value.trim()||'';exploreCategory='ALL';remoteSearchUsers=[];remoteSearchPosts=[];
   if(remoteMode&&db&&exploreQuery.trim().length>=2){
    const q=exploreQuery.trim().replace(/[%_,]/g,'');
    const [people,posts]=await Promise.all([
      db.from('profiles').select('id,username,bio,avatar_url').ilike('username','%'+q+'%').limit(12),
      db.from('posts').select('id,user_id,body,category,font_family,media_url,media_type,community_id,created_at,post_type,poll_data,profiles(username,avatar_url)').ilike('body','%'+q+'%').order('created_at',{ascending:false}).limit(30)
    ]);
    if(people.error)throw people.error;if(posts.error)throw posts.error;
    remoteSearchUsers=people.data||[];
    remoteSearchPosts=(posts.data||[]).map(p=>({...p,name:p.profiles?.username||'Member',handle:userHandle(p.profiles?.username||'Member'),avatar_url:p.profiles?.avatar_url,likes_count:0,comments_count:0,comments:[]}));
   }
   renderApp();return;
  }
  if(form.id==='messages-search-form'){event.preventDefault();await searchMessagePeople($('#messages-user-query')?.value||'');return;}
  if(form.id==='dm-send-form'){event.preventDefault();const send=$('button[type="submit"]',form);if(send){send.disabled=true;send.textContent='Sending…'}try{await sendMessage(form)}finally{const current=$('#dm-send-form button[type="submit"]');if(current){current.disabled=false;current.textContent='Send ↗'}}return;}
  if(form.id==='age-form') {
   event.preventDefault();const raw=$('#birthday')?.value;if(!raw)return;
   const birth=new Date(raw+'T00:00:00');const now=new Date();
   if(Number.isNaN(birth.getTime())||birth>now){toast('Enter a valid birthday.');return}
   let age=now.getFullYear()-birth.getFullYear();const month=now.getMonth()-birth.getMonth();if(month<0||(month===0&&now.getDate()<birth.getDate()))age--;
   if(age<13){showGate('under13');return}
   storage.setItem(AGE_KEY,'declared');showGate('welcome');return;
  }
  if(form.id==='local-profile-form') {
   event.preventDefault();const name=$('#local-name')?.value.trim();if(!name)return;
   state.profile={username:name.slice(0,24),initials:initials(name)};saveLocal();setProfile(state.profile);showGate('');navigate('/home');renderApp();toast('Local demo profile created.');return;
  }
  if(form.id==='auth-form') {
   event.preventDefault();const submit=$('button[type="submit"]',form);if(submit){submit.disabled=true;submit.textContent='Working…'}
   try{await submitAuth(form)}catch(err){console.error(err);showGate('auth',err.message||'Sign-in failed. Check your email and password.')}
   finally{const current=$('#auth-form button[type="submit"]');if(current){current.disabled=false;current.textContent=authMode==='signup'?'Create account':'Sign in'}}
   return;
  }
  if(form.id==='post-form') {event.preventDefault();const submit=$('button[type="submit"]',form);if(submit){submit.disabled=true;submit.textContent='Publishing…'}try{await publishPost(form)}catch(err){console.error(err);toast(err.message||'Could not publish the post.')}finally{const current=$('#post-form button[type="submit"]');if(current){current.disabled=false;current.textContent='Publish ↗'}}return;}
  if(form.matches('[data-comment-form]')) {event.preventDefault();const submit=$('button[type="submit"]',form);if(submit){submit.disabled=true;submit.textContent='Sending…'}try{await addComment(form)}catch(err){console.error(err);toast(err.message||'Could not publish reply.')}finally{const current=$('button[type="submit"]',form);if(current){current.disabled=false;current.textContent='Reply'}}return;}
 } catch(err){console.error(err);toast(err.message||'Something went wrong.')}
});
document.addEventListener('input',event=>{
 if(event.target&&event.target.id==='post-body'){
  state.drafts=state.drafts||{};state.drafts.postDraft=event.target.value;saveLocal();
 }
});
document.addEventListener('change',async event=>{
 if(event.target.id==='post-file') {
  const file=event.target.files?.[0];if(!file)return;
  if(!safeMedia(file)){toast('Choose PNG, JPEG, GIF, WebP, AVIF, MP4, WebM or MOV.');event.target.value='';return}
  const isVideo=String(file.type||'').startsWith('video/');
  const limit=isVideo?50000000:(remoteMode?8000000:1200000);
  if(isVideo&&!remoteMode){toast('Video uploads require a configured Supabase account.');event.target.value='';return}
  if(file.size>limit){toast(isVideo?'Videos must be 50 MB or smaller.':remoteMode?'Images must be 8 MB or smaller.':'Demo images must be 1.2 MB or smaller.');event.target.value='';return}
  selectedFile=file;
  const reader=new FileReader();
  reader.onload=()=>{const holder=$('#attachment-preview');if(holder){const src=String(reader.result);holder.innerHTML='<div class="attachment-preview">'+(isVideo?'<video controls playsinline preload="metadata" src="'+src.replace(/"/g,'&quot;')+'" style="max-width:100%;max-height:300px"></video>':'<img src="'+src+'" alt="Attachment preview">')+'<button type="button" id="remove-attachment" aria-label="Remove attachment">×</button></div>'}};
  reader.readAsDataURL(file);
 }
 if(event.target.id==='font-upload')importFont(event.target.files?.[0]);
 if(event.target.id==='profile-theme'){state.theme=['red','purple','blue','green'].includes(event.target.value)?event.target.value:'red';saveLocal();applyTheme();toast('Accent theme updated.');}
 if(event.target.id==='reduce-motion'){state.reduceMotion=event.target.checked;saveLocal();document.body.classList.toggle('reduce-motion',state.reduceMotion)}
});
document.addEventListener('click',event=>{
 if(event.target.id==='remove-attachment'){selectedFile=null;$('#attachment-preview').innerHTML='';const file=$('#post-file');if(file)file.value=''}
});
$('#command-form').addEventListener('submit',event=>{
 event.preventDefault();const value=$('#command-input').value.trim();if(!value)return;const key=value.toLowerCase().split(/\s+/)[0];
 if(routes.has(key)){navigate(key);$('#command-input').value='';return}
 if(value.startsWith('/')){navigate('/help');toast('Command not found. Open /help to see available commands.');$('#command-input').value='';return}
 exploreQuery=value;exploreCategory='ALL';navigate('/explore');$('#command-input').value='';
});
document.addEventListener('keydown',event=>{
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();$('#command-input').focus();$('#command-input').select()}
 else if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.activeElement.isContentEditable){event.preventDefault();$('#command-input').focus()}
 else if(event.key==='Escape'&&document.activeElement===$('#command-input'))$('#command-input').blur()
 else if(routeFromHash()==='/reels'&&event.key==='ArrowDown'){currentReel=(currentReel+1)%reels.length;renderApp()}
 else if(routeFromHash()==='/reels'&&event.key==='ArrowUp'){currentReel=(currentReel+reels.length-1)%reels.length;renderApp()}
});
window.addEventListener('hashchange',async()=>{
 if(gateStep&&gateStep!=='') {
  if(location.hash==='#/terms'&&(gateStep==='welcome'||gateStep==='birch')){termsOpenedThisVisit=true;showGate('terms');return}
  if(gateStep!=='')return;
 }
 renderApp();
 if(remoteMode&&['/home','/feed','/posts','/explore','/reels'].includes(routeFromHash()))await refreshRemotePosts();
 if(remoteMode&&routeFromHash()==='/communities'){await refreshRemoteCommunities();renderApp()}
 if(remoteMode&&routeFromHash()==='/community')await refreshCommunityPosts();
 if(remoteMode&&routeFromHash()==='/messages'){await refreshMessageThreads();if(activeMessagePeer)await refreshMessageHistory();renderApp()}
 if(remoteMode&&routeFromHash()==='/notifications'){await refreshNotifications();renderApp()}
});
const cssFontStyle=document.createElement('style');document.head.appendChild(cssFontStyle);
function routeForStyles(){return routeFromHash()}
window.addEventListener('storage',()=>{if(!remoteMode){Object.assign(state,getStoredState());renderApp()}});
async function start() {
 const ok=resetGateIfNeeded();if(!ok)return;
 if(db) {
  try {
   const {data,error}=await db.auth.getSession();if(error)throw error;
   if(data.session) {
    user=data.session.user;remoteMode=true;
    try{await ensureProfile(user)}catch(err){console.error(err);showGate('auth','You are signed in, but your profile table is not ready. Run supabase-schema.sql in your project.');return}
    await refreshSafetyControls();
     await refreshRemoteCommunities();await refreshNotifications();await startRealtimeSubscriptions();
     gateStep='';showGate('');await refreshRemotePosts();renderApp();
    return;
   }
  } catch(err){console.error(err);authMode='login';showGate('auth','Could not reach Supabase. Verify the URL, publishable key, and database setup.');return}
  authMode='signup';showGate('auth');return;
 }
 if(state.profile){profile=state.profile;remoteMode=false;gateStep='';showGate('');renderApp();return}
 showGate('profile');
}
start();
})();