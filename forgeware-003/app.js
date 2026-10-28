(() => {
'use strict';
const VERSION = '0.03';
const AGE_KEY = 'revenant_fw003_age';
const TERMS_KEY = 'revenant_fw003_terms';
const STATE_KEY = 'revenant_fw003_local';
const TERMS_VERSION = 'revenant-community-rules-0.03';
let storage;
try { storage=window.localStorage; const probe='__revenant_fw002_probe'; storage.setItem(probe,'1'); storage.removeItem(probe); }
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
const state = Object.assign({profile:null,posts:demoSeeds.map(p=>({...p,comments:p.comments.map(c=>({...c}))})),bookmarks:[],likedLocal:[],reduceMotion:false},getStoredState());
if (!Array.isArray(state.posts)) state.posts = demoSeeds.map(p=>({...p,comments:p.comments.map(c=>({...c}))}));
if (!Array.isArray(state.bookmarks)) state.bookmarks=[];
if (!Array.isArray(state.likedLocal)) state.likedLocal=[];
if (!Array.isArray(state.notifications)) state.notifications=[{id:'n1',type:'system',title:'Welcome to Forgeware 0.03',body:'Explore new search, polls, drafts, saved posts, and profile tools.',time:'Just now',unread:true},{id:'n2',type:'community',title:'Community spotlight',body:'Indie Dev Corner is looking for new projects.',time:'12 min ago',unread:true},{id:'n3',type:'system',title:'Version update',body:'Forgeware 0.03 is still an evolving prototype.',time:'Today',unread:false}];
if (!state.drafts || typeof state.drafts!=='object') state.drafts={postDraft:''};
if (!Array.isArray(state.joinedCommunities)) state.joinedCommunities=[];
if (!Array.isArray(state.likedReels)) state.likedReels=[];
if (!Array.isArray(state.pollVotes)) state.pollVotes=[];
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
    try { storage.setItem(STATE_KEY, JSON.stringify({profile: state.profile, bookmarks: state.bookmarks, reduceMotion: state.reduceMotion, likedLocal: state.likedLocal, notifications:state.notifications, drafts:state.drafts, joinedCommunities:state.joinedCommunities, likedReels:state.likedReels, pollVotes:state.pollVotes})); return true; } catch (_) { return false; }
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
    state.profile={id:profile.id||null,username:profile.username||'Member',initials:initials(profile.username),avatar_url:profile.avatar_url||null};
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
  return '<form class="composer" id="post-form"><div class="compose-row">'+renderAvatar((profile||state.profile||{}).username||'R')+'<div class="compose-main"><textarea id="post-body" maxlength="2000" placeholder="What is happening in your world?" aria-label="Write a post">'+escapeHtml((state.drafts||{}).postDraft||'')+'</textarea><div id="attachment-preview"></div><div class="poll-builder hidden" id="poll-builder"><div class="small" style="font-weight:800;margin-bottom:6px">Poll options</div><input class="field" id="poll-option-1" maxlength="90" placeholder="Option 1"><input class="field" id="poll-option-2" maxlength="90" placeholder="Option 2"><input class="field" id="poll-option-3" maxlength="90" placeholder="Option 3 (optional)"><input class="field" id="poll-option-4" maxlength="90" placeholder="Option 4 (optional)"><div class="field-help">One vote per profile in this prototype.</div></div><div class="compose-tools"><span class="post-type-toggle"><button type="button" data-action="set-post-type" data-type="post" class="active">Post</button><button type="button" data-action="set-post-type" data-type="poll">Poll</button></span><label class="file-button">▧ Image / GIF<input type="file" id="post-file" accept="image/png,image/jpeg,image/gif,image/webp,image/avif"></label><button type="button" class="tool-button" id="open-font-import">Aa Import font</button><select id="post-font" class="mini-select" aria-label="Post font">'+fontOptions('standard')+'</select><select id="post-category" class="mini-select" aria-label="Post category"><option>GENERAL</option><option>GAMING</option><option>ART & DESIGN</option><option>TECH</option><option>DISCUSSION</option><option>MEMES</option></select><span class="spacer"></span><button type="button" class="tool-button" data-action="save-draft">Save draft</button><button class="button button-primary button-small" type="submit">Publish ↗</button></div><div class="field-help">'+(remoteMode?'Posts are shared with signed-in users.':'Demo mode: posts stay in this browser.')+'</div></div></div></form>';
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
  const comments=Array.isArray(p.comments)?p.comments:[];
  const isOwn=remoteMode?!!user&&p.user_id===user.id:!!p.own;
  const media=p.media_url&&/^https:\/\//.test(p.media_url)?'<img class="post-media" loading="lazy" src="'+escapeHtml(p.media_url)+'" alt="Post attachment">':(p.attachmentData&&/^data:image\/(png|jpeg|gif|webp|avif);base64,/i.test(p.attachmentData)?'<img class="post-media" loading="lazy" src="'+p.attachmentData+'" alt="Post attachment">':'');
  let replyMarkup='';
  if(showComments) {
    replyMarkup='<section class="comments"><div class="tiny muted">'+(comments.length?comments.length+' replies':'Start the conversation')+'</div>'+comments.map(renderComment).join('')+'<form class="comment-form" data-comment-form="'+escapeHtml(id)+'"><input name="comment" maxlength="500" required placeholder="Write a reply…" aria-label="Write a reply"><button class="button button-primary button-small" type="submit">Reply</button></form><div class="comment-tools"><label>Text style <select data-comment-font="'+escapeHtml(id)+'">'+fontOptions('standard')+'</select></label><span class="tiny muted">Each reply can have its own font.</span></div></section>';
  }
  return '<article class="post-card" data-post="'+escapeHtml(id)+'"><div class="post-header">'+renderAvatar(p.name,p.avatar,p.avatar_url)+'<div class="post-author"><div class="author-meta"><span class="author-name">'+escapeHtml(p.name||'Member')+'</span><span class="handle">'+escapeHtml(p.handle||userHandle(p.name))+'</span>'+(p.badge?'<span class="pill">'+escapeHtml(p.badge)+'</span>':'')+'</div><div class="timestamp">'+formatTime(p.created_at||p.time)+'</div></div><button class="post-dots" data-action="post-menu" data-id="'+escapeHtml(id)+'" aria-label="Post options">···</button></div><div class="post-body '+fontClass(p.font_family||p.font)+'">'+escapeHtml(p.body||p.text||'')+'</div>'+media+'<span class="category-chip">'+escapeHtml(p.category||p.tag||'GENERAL')+'</span><div class="post-actions"><button class="action-button '+(liked?'active':'')+'" data-action="like" data-id="'+escapeHtml(id)+'"><span class="symbol">'+(liked?'♥':'♡')+'</span>'+likeCount+'</button><button class="action-button" data-action="comments" data-id="'+escapeHtml(id)+'"><span class="symbol">▱</span>'+(p.comments_count||comments.length||0)+'</button><button class="action-button" data-action="share" data-id="'+escapeHtml(id)+'"><span class="symbol">↗</span>Share</button><span class="action-spacer"></span><button class="action-button '+(state.bookmarks.includes(id)?'active':'')+'" data-action="bookmark" data-id="'+escapeHtml(id)+'"><span class="symbol">⌑</span>Save</button></div>'+replyMarkup+'</article>';
}
function renderHome() {
  const items=state.posts.slice(0,2);
  return '<section class="hero"><div class="hero-content"><span class="eyebrow">FORGEWARE 0.03 · SOCIAL PREVIEW</span><h1>Your corner of the <span class="accent">internet.</span></h1><p>Posts, people, short videos, and communities in one place. The foundation is here; shared accounts and Posts can be enabled with your own Supabase project.</p><div class="hero-actions"><a href="#/posts" class="button button-primary">Write a post ↗</a><a href="#/reels" class="button button-quiet">Explore Reels ▣</a></div></div></section><div class="stats"><div class="stat-card"><b>'+state.posts.length+'</b><span>'+(remoteMode?'Shared posts loaded':'Demo posts')+'</span></div><div class="stat-card"><b>09</b><span>Destinations</span></div><div class="stat-card"><b>0.02</b><span>Current build</span></div></div><div class="section-heading">Recent posts <a class="button button-small" href="#/posts">See all ↗</a></div>'+(items.length?items.map(p=>renderPost(p,false)).join(''):'<div class="empty-state"><div class="empty-icon">▤</div><strong>No posts yet</strong>Open Posts to publish the first one.</div>')+'<div class="notice">Forgeware 0.03 is still a prototype. The backend status is shown in Settings.</div>';
}
function renderPosts(feed=false) {
  let items=state.posts.slice();
  if(feed && !remoteMode) items=items.filter(p=>!p.seed || true);
  if(feed)items.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
  return pageHeading(feed?'Your Feed':'Posts',feed?'A timeline of new posts and conversations.':'Your place for text posts, memes, pictures, polls, links, and discussions.','<button class="button button-small" data-action="focus-compose">＋ Compose</button>')+composer()+'<div class="section-heading"><span>'+(feed?'LATEST POSTS':'THE DISCUSSION BOARD')+'</span><span class="pill">'+items.length+' posts</span></div>'+(items.length?items.map(p=>renderPost(p,commentsOpen.has(String(p.id)))).join(''):'<div class="empty-state"><div class="empty-icon">▤</div><strong>No posts yet</strong>Be the first to start a conversation.</div>')+(remoteMode?'':'<p class="demo-notice">Demo posts are examples. Your new posts are stored only in this browser until a backend is connected.</p>');
}
function renderReels() {
  const r=reels[currentReel%reels.length];
  return pageHeading('Reels','Short-form videos and quick creative moments.','<span class="pill">DEMO '+(currentReel+1)+' / '+reels.length+'</span>')+'<div class="reels-wrap"><article class="reel-card '+r.theme+'"><div class="reel-watermark">R</div><div class="reel-top"><span class="dot"></span> REVENANT REELS <span style="margin-left:auto">'+escapeHtml(r.tag)+'</span></div><div class="reel-main"><div class="reel-symbol">'+r.symbol+'</div><h2>'+escapeHtml(r.title)+'</h2><p>'+escapeHtml(r.caption)+'</p><span class="pill">FORGEWARE ORIGINAL · PLACEHOLDER</span></div><div class="reel-bottom"><div class="reel-copy"><b>'+escapeHtml(r.author)+' <span class="muted" style="font-weight:400">'+escapeHtml(r.handle)+'</span></b><p>'+escapeHtml(r.caption)+'</p></div><div class="reel-controls"><button data-action="reel-like" aria-label="Like Reel">'+(state.likedReels&&state.likedReels.includes(currentReel)?'♥':'♡')+'</button><button data-action="reel-comment" aria-label="Comment on Reel">▱</button><button data-action="reel-share" aria-label="Share Reel">↗</button></div></div></article><div class="reel-pagination"><button data-action="reel-prev">↑ Previous</button><button data-action="reel-next">Next ↓</button></div><p class="tiny muted" style="text-align:center">These are interactive placeholder cards. Real video uploads and playback are not connected yet.</p></div>';
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
function renderTerms() {
 return pageHeading('Terms of Service','The six short rules and important service limitations.')+'<section class="panel" style="padding:17px;margin-bottom:13px"><span class="eyebrow">COMMUNITY RULES</span><h2 style="margin:6px 0;font-size:20px">Minimal rules. Essential boundaries.</h2><p class="muted small">We want people to share ideas, create things, joke around, disagree, and build communities. These are the baseline rules.</p></section>'+rulesMarkup(false);
}
function renderSettings() {
 const connected=!!db;
 return pageHeading('Settings','Profile, font imports, onboarding, and backend configuration.')+'<div class="setting-grid"><section class="setting-card"><label>Your profile</label><p>Change the display name connected to your current browser or account.</p><input class="field" id="profile-name" maxlength="24" value="'+escapeHtml((profile||state.profile||{}).username||'')+'" placeholder="Display name"><button class="button button-primary button-small" id="save-profile" style="margin-top:10px">Save profile</button></section><section class="setting-card"><label>Backend connection</label><p>Real cross-device accounts and shared posts use Supabase Auth, Postgres, and Row Level Security.</p><span class="pill"><span class="dot" style="background:'+(connected?'#66d7a4':'#d9a24d')+'"></span>'+(connected?'Project configured':'Not configured · local demo')+'</span><div class="field-help">'+(connected?'Configured URL: '+escapeHtml(config.supabaseUrl):'Add your project URL and publishable key in config.js, then run supabase-schema.sql in the Supabase SQL Editor.')+'</div><a class="button button-small" href="https://supabase.com/dashboard" target="_blank" rel="noopener" style="margin-top:10px">Open Supabase ↗</a></section><section class="setting-card"><label>Import a font</label><p>Load a locally licensed TTF, OTF, WOFF, or WOFF2 file for previews in this browser. ZIP extraction and server-wide font hosting come later.</p><label class="file-button" style="border:1px solid var(--line);border-radius:9px">＋ Choose font<input type="file" id="font-upload" accept=".ttf,.otf,.woff,.woff2"></label><div class="status-line" id="font-status">'+(customFontReady?'Loaded for this session: '+escapeHtml(importedFontName):'No custom font loaded in this session.')+'</div></section><section class="setting-card"><label>Appearance</label><p>Forgeware uses the Revenant black-and-red palette.</p><label class="field-label"><input type="checkbox" id="reduce-motion" '+(state.reduceMotion?'checked':'')+'> Reduce decorative motion</label><p class="field-help">Also respects your device reduced-motion setting.</p></section><section class="setting-card"><label>Onboarding</label><p>Replay the age gate and the Terms of Service screen to test the first-visit experience.</p><button class="button button-small" data-action="reset-onboarding">Reset onboarding</button></section><section class="setting-card"><label>Local demo data</label><p>Export your demo content or clear the stored prototype data in this browser.</p><button class="button button-small" id="export-data">Export JSON</button> <button class="button button-small" id="reset-demo">Reset demo</button></section><section class="setting-card"><label>Account session</label><p>'+(user?'Signed in as '+escapeHtml((profile||{}).username||user.email||'member'):'No backend account signed in.')+'</p>'+(user?'<button class="button button-small" data-action="signout">Sign out</button>':'<button class="button button-small button-primary" data-action="open-auth">Sign in / create account</button>')+'</section></div><div class="notice">Never place a Supabase service-role or secret key in frontend code. Forgeware should use only a publishable key in the browser with database Row Level Security enabled.</div>';
}
function renderProfile() {
 const p=profile||state.profile||{username:'Visitor'};
 const items=state.posts.filter(x=>remoteMode?x.user_id===user?.id:x.own);
 return '<section class="hero"><div class="hero-content"><span class="eyebrow">YOUR REVENANT ID</span><h1>'+escapeHtml(p.username||'Visitor')+'</h1><p>Your profile and post history. Animated avatars and profile themes will expand in later builds.</p><div class="hero-actions"><a class="button button-primary" href="#/settings">Edit profile</a><a class="button button-quiet" href="#/posts">Write a post</a></div></div></section><div class="stats"><div class="stat-card"><b>'+items.length+'</b><span>Your posts</span></div><div class="stat-card"><b>Free</b><span>Profile styles</span></div><div class="stat-card"><b>0.02</b><span>Current build</span></div></div><div class="section-heading">Your posts</div>'+(items.length?items.map(p=>renderPost(p,commentsOpen.has(String(p.id)))).join(''):'<div class="empty-state"><div class="empty-icon">◌</div><strong>No posts here yet</strong>Publish something from Posts to build your profile.</div>');
}
function renderCommunities() {
 const groups=[['PW','Pixel Workshop','Art, sprites, fan art, and tiny worlds.','Art & design','blue'],['ID','Indie Dev Corner','Build logs, coding questions, and game prototypes.','Technology','green'],['MC','Minecraft & Mods','Modpacks, builds, technical help, and survival stories.','Gaming','orange'],['CC','Clip Central','Funny clips, Reels, and gaming moments.','Entertainment','']];
 return pageHeading('Communities','Topic-based places for people who enjoy the same things.','<span class="pill">SAMPLE GROUPS</span>')+'<section class="panel" style="padding:16px;margin-bottom:13px"><span class="eyebrow">DISCOVER</span><h2 style="margin:7px 0">Find your people.</h2><p class="muted small">Community previews are included in Forgeware 0.03. Creating and joining persistent communities comes in a later backend milestone.</p></section>'+groups.map(g=>'<article class="post-card community-card"><span class="avatar '+g[4]+'">'+g[0]+'</span><div class="community-info"><b>'+g[1]+'</b><p>'+g[2]+'</p><div class="community-meta"><span class="pill">'+g[3]+'</span><span class="pill">Public preview</span></div></div><button class="button button-small" data-action="join-community" data-name="'+escapeHtml(g[1])+'">View</button></article>').join('');
}
function renderMessages() {
 return pageHeading('Messages','Direct conversations, designed for a future shared release.','<span class="pill">PREVIEW</span>')+'<section class="panel" style="padding:32px 20px;text-align:center"><div style="font-size:34px">✉</div><h2 style="margin:8px 0">Your inbox is waiting.</h2><p class="muted small" style="max-width:350px;margin:0 auto 15px">Messaging needs user-to-user permissions, private storage, abuse controls, and real-time updates. This destination is a preview in 0.02.</p><a class="button button-primary" href="#/communities">Explore communities</a></section>';
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
 else if(currentRoute==='/reels')main.innerHTML=renderReels();
 else if(currentRoute==='/terms')main.innerHTML=renderTerms();
 else if(currentRoute==='/settings')main.innerHTML=renderSettings();
 else if(currentRoute==='/profile')main.innerHTML=renderProfile();
 else if(currentRoute==='/communities')main.innerHTML=renderCommunities();
 else if(currentRoute==='/messages')main.innerHTML=renderMessages();
 else main.innerHTML=renderHelp();
 $('#main-content').focus({preventScroll:true});
 document.body.classList.toggle('reduce-motion',!!state.reduceMotion);
}
function routeFromHash() {
 let p=(location.hash||'#/home').replace(/^#/,'').split('?')[0].toLowerCase();
 if(!p.startsWith('/'))p='/'+p;
 const known=['/home','/feed','/posts','/reels','/terms','/settings','/profile','/communities','/messages','/help','/upload','/explore','/saved','/notifications','/drafts'];
 return known.includes(p)?(p==='/upload'?'/posts':p):'/home';
}
const routes=new Set(['/home','/feed','/posts','/reels','/terms','/settings','/profile','/communities','/messages','/help','/upload','/explore','/saved','/notifications','/drafts']);
function navigate(path) {
 if(!routes.has(path)){toast('Unknown destination. Try /home, /feed, /posts, /reels, or /terms.');return}
 if(path==='/upload')path='/posts';
 if(location.hash==='#'+path) { renderApp(); return; }
 location.hash='#'+path;
}
function showGate(step, message='') {
 gateStep=step;
 const root=$('#gate-root');
 let body='';
 if(step==='age') {
  body='<div class="gate-brand"><span class="brand-mark">R</span><span><strong class="brand-name">REVENANT</strong><small>FORGEWARE 0.03</small></span></div><span class="eyebrow">BEFORE YOU ENTER</span><h1>First things first.</h1><p class="gate-copy">Revenant is intended for users aged 13 and older. Enter your birthday to continue.</p><form id="age-form"><label class="field-label" for="birthday">Your date of birth</label><input class="field" id="birthday" type="date" max="'+new Date().toISOString().slice(0,10)+'" required><div class="notice">This prototype checks the date you enter but does not verify your age. A public service needs appropriate age-safety and privacy measures.</div><button class="button button-primary button-block" type="submit">Continue →</button></form>';
 } else if(step==='welcome') {
  body='<div class="gate-brand"><span class="brand-mark">R</span><span><strong class="brand-name">REVENANT</strong><small>FORGEWARE 0.03</small></span></div><span class="eyebrow">BEFORE YOU ENTER</span><h1>Welcome to Reven.</h1><p class="gate-copy">We have a few rules. They’re short. Please take a moment to review them.</p><div class="rule-preview"><div>01&nbsp; No illegal content or exploitation.</div><div>02&nbsp; No credible threats, doxxing, or targeted harassment.</div><div>03&nbsp; No scams, malware, or account theft.</div><div>04&nbsp; Respect privacy. Be creative. Don’t abuse the platform.</div></div><a href="#/terms" class="button button-block" data-gate="read-terms">Read Terms of Service</a><div class="gate-actions"><button class="button button-primary" data-gate="agree">Agree & continue</button></div><p class="gate-footnote">This is the short community-rules summary. The real service needs full Terms of Service and Privacy Policy documents.</p>';
 } else if(step==='birch') {
  body='<div class="gate-brand"><span class="brand-mark">R</span><span><strong class="brand-name">REVENANT</strong><small>QUICK REALITY CHECK</small></span></div><div class="joke">Burch.</div><h1>Come on. You probably didn’t read that, did you?</h1><p class="gate-copy">Don’t worry, we made it short as hell for a reason.</p><div class="notice">No mind reading here. You agreed without opening the rules, so we’re sending you back to them.</div><button class="button button-primary button-block" data-gate="read-terms">Fine, show me the rules</button>';
 } else if(step==='terms') {
  body='<div class="gate-brand"><span class="brand-mark">R</span><span><strong class="brand-name">REVENANT</strong><small>THE SMALL PRINT. ACTUALLY SMALL.</small></span></div><span class="eyebrow">COMMUNITY RULES · V0.02</span><h1>The rules. All six.</h1>'+rulesMarkup(true)+'<button class="button button-primary button-block" style="margin-top:15px" data-gate="accept-terms">I reviewed the rules — continue</button><p class="gate-footnote">This is a prototype rules summary, not the complete legal Terms of Service or Privacy Policy.</p>';
 } else if(step==='auth') {
  body=renderAuthGate(message);
 } else if(step==='profile') {
  body='<div class="gate-brand"><span class="brand-mark">R</span><span><strong class="brand-name">REVENANT</strong><small>YOUR SPACE IS WAITING</small></span></div><h1>Make yourself at home.</h1><p class="gate-copy">Create a local demo profile to explore Forgeware 0.03. Without a backend connection, posts stay in this browser and aren’t shared with other users.</p><form id="local-profile-form"><label class="field-label" for="local-name">Choose a display name</label><input class="field" id="local-name" maxlength="24" required placeholder="e.g. PixelFox"><button type="submit" class="button button-primary button-block">Create demo profile</button></form><div class="gate-actions"><button class="button button-quiet" data-gate="quick-local">Quick setup — generate a name</button></div><p class="gate-footnote">This is a local prototype profile, not an online account.</p>';
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
 return '<div class="gate-brand"><span class="brand-mark">R</span><span><strong class="brand-name">REVENANT</strong><small>FORGEWARE 0.03</small></span></div><span class="eyebrow">YOUR ACCOUNT</span><h1>'+(signup?'Join the conversation.':'Welcome back.')+'</h1><p class="gate-copy">'+(backendConfigured?'This connects to your Supabase project. Use an email address you can access for account confirmation and recovery.':'Backend is not configured yet. You can create a local demo profile, or configure Supabase to use real accounts and shared posts.')+'</p>'+(message?'<div class="notice">'+escapeHtml(message)+'</div>':'')+(backendConfigured?'<div class="gate-actions"><button class="button '+(signup?'button-primary':'')+'" data-gate="auth-signup">Create account</button><button class="button '+(!signup?'button-primary':'')+'" data-gate="auth-login">Sign in</button></div><form id="auth-form">'+(signup?'<label class="field-label" for="auth-username">Username</label><input id="auth-username" class="field" name="username" maxlength="24" pattern="[A-Za-z0-9_ -]{2,24}" required placeholder="PixelFox">':'')+'<label class="field-label" for="auth-email">Email</label><input id="auth-email" class="field" type="email" name="email" autocomplete="email" required placeholder="you@example.com"><label class="field-label" for="auth-password">Password</label><input id="auth-password" class="field" type="password" name="password" autocomplete="'+(signup?'new-password':'current-password')+'" minlength="10" required placeholder="At least 10 characters">'+(signup?'<div class="notice">Use a unique password. The full Terms and Privacy Policy must be ready before a public launch.</div>':'')+'<button class="button button-primary button-block" type="submit" style="margin-top:12px">'+(signup?'Create account':'Sign in')+'</button></form><div class="gate-actions"><button class="button button-quiet" data-gate="demo-profile">Try local demo instead</button></div>':'<button class="button button-primary button-block" data-gate="demo-profile">Create a local demo profile</button><p class="gate-footnote">To enable real accounts, set the Supabase project URL and publishable key in config.js and run the included SQL schema.</p>');
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
 if(existing){user=authUser;setProfile(existing);return existing}
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
 const {data:rows,error}=await db.from('posts').select('id,user_id,body,category,font_family,media_url,created_at,profiles(username,avatar_url)').order('created_at',{ascending:false}).limit(40);
 if(error){console.error(error);toast('Could not load shared posts. Check your Supabase schema and policies.');return}
 const {data:likes,error:likesError}=await db.from('post_likes').select('post_id,user_id');
 if(!likesError){likedRemote.clear();const counts={};(likes||[]).forEach(l=>{counts[l.post_id]=(counts[l.post_id]||0)+1;if(user&&l.user_id===user.id)likedRemote.add(l.post_id)});remotePosts=(rows||[]).map(r=>({...r,name:r.profiles?.username||'Member',handle:userHandle(r.profiles?.username||'Member'),avatar_url:r.profiles?.avatar_url,likes_count:counts[r.id]||0,comments_count:0,comments:[]}));}
 else remotePosts=(rows||[]).map(r=>({...r,name:r.profiles?.username||'Member',handle:userHandle(r.profiles?.username||'Member'),avatar_url:r.profiles?.avatar_url,likes_count:0,comments_count:0,comments:[]}));
 const {data:commentRows,error:commentError}=await db.from('comments').select('post_id');
 if(!commentError){const counts={};(commentRows||[]).forEach(c=>counts[c.post_id]=(counts[c.post_id]||0)+1);remotePosts.forEach(p=>p.comments_count=counts[p.id]||0)}
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

function addNotification(item){
 state.notifications=Array.isArray(state.notifications)?state.notifications:[];
 state.notifications.unshift({id:'note-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),type:'system',time:'Just now',unread:true,...item});
 state.notifications=state.notifications.slice(0,80);
}
function renderExplore(){
 const q=exploreQuery.trim().toLowerCase();
 let posts=state.posts.filter(p=>!q||[p.body,p.text,p.name,p.handle,p.category,p.tag].join(' ').toLowerCase().includes(q));
 if(exploreCategory!=='ALL')posts=posts.filter(p=>(p.category||p.tag||'GENERAL').toUpperCase()===exploreCategory);
 posts.sort((a,b)=>Number(b.likes_count||b.likes||0)-Number(a.likes_count||a.likes||0));
 const chips=['ALL','GAMING','ART & DESIGN','TECH','DISCUSSION','MEMES'];
 return pageHeading('Explore','Search posts, topics, and ideas across Revenant.','<span class="pill">DISCOVER</span>')+
 '<form id="explore-form" class="explore-search"><input id="explore-query" maxlength="100" value="'+escapeHtml(exploreQuery)+'" placeholder="Search posts, people, topics…" aria-label="Search Revenant"><button class="button button-primary" type="submit">Search ↗</button></form>'+
 '<div class="topic-chips">'+chips.map(t=>'<button type="button" class="'+(exploreCategory===t?'active':'')+'" data-action="explore-category" data-category="'+t+'">'+t+'</button>').join('')+'</div>'+
 '<section class="panel" style="padding:14px;margin-bottom:14px"><div class="panel-heading">Trending topics <span class="accent">↗</span></div><div class="topic-chips"><button data-action="topic-search" data-topic="Minecraft">#Minecraft</button><button data-action="topic-search" data-topic="IndieGames">#IndieGames</button><button data-action="topic-search" data-topic="Pixel art">Pixel art</button><button data-action="topic-search" data-topic="web building">Web building</button></div><div class="tiny muted">Topic trends are illustrative in this prototype, not live global analytics.</div></section>'+
 '<div class="section-heading">Results <span class="pill">'+posts.length+' posts</span></div>'+
 (posts.length?posts.map(p=>renderPost(p,commentsOpen.has(String(p.id)))).join(''):'<div class="empty-state"><div class="empty-icon">⌕</div><strong>No matching posts</strong>Try another phrase or change the category filter.</div>');
}
function renderSaved(){
 const ids=new Set((state.bookmarks||[]).map(String));
 const items=state.posts.filter(p=>ids.has(String(p.id)));
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

function renderHelp() {
 const cmds=[['/home','Open the home dashboard'],['/feed','Browse the timeline'],['/posts','Create and browse text posts'],['/reels','Open short-video cards'],['/terms','Read the community rules'],['/settings','Profile, fonts, and backend'],['/messages','Open the message preview'],['/communities','Browse sample communities'],['/profile','View your profile']];
 return pageHeading('Command guide','Quick navigation for advanced users.')+'<section class="panel" style="padding:14px">'+cmds.map(c=>'<div class="topic-row"><div><b class="mono accent">'+c[0]+'</b><small>'+c[1]+'</small></div><button class="button button-small" data-command="'+c[0]+'">Run ↗</button></div>').join('')+'</section>';
}
async function publishPost(form) {
 const body=$('#post-body').value.trim();
 if(!body&&!selectedFile){toast('Write something or attach an image first.');return}
 const category=$('#post-category').value||'GENERAL';
 const font=$('#post-font').value||'standard';
 let mediaUrl=null;
 if(remoteMode&&db&&selectedFile) {
  if(!user){toast('Sign in to upload a shared attachment.');return}
  const path=user.id+'/'+crypto.randomUUID()+'-'+safeName(selectedFile.name);
  const {error:uploadError}=await db.storage.from('post-media').upload(path,selectedFile,{contentType:selectedFile.type,upsert:false});
  if(uploadError)throw uploadError;
  const {data}=db.storage.from('post-media').getPublicUrl(path);mediaUrl=data.publicUrl;
 } else if(!remoteMode&&selectedFile) {
  const data=await readAsDataURL(selectedFile);
  if(data.length>2_200_000){toast('That image is too large for local demo storage. Try a smaller file.');return}
  mediaUrl=data;
 }
 if(remoteMode&&db) {
  if(!user){toast('Sign in before publishing a shared post.');return}
  const {data,error}=await db.from('posts').insert({user_id:user.id,body,category,font_family:font,media_url:mediaUrl}).select('id').single();
  if(error)throw error;
  selectedFile=null;renderApp();await refreshRemotePosts();toast('Post published to shared Revenant.');return;
 }
 const p={id:'local-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name:(profile||state.profile||{}).username||'Visitor',handle:userHandle((profile||state.profile||{}).username||'Visitor'),created_at:new Date().toISOString(),category,body,font_family:font,likes_count:0,comments_count:0,comments:[],own:true};
 if(selectedFile){p.attachmentData=mediaUrl;p.attachmentName=selectedFile.name}
 state.posts.unshift(p);state.posts=state.posts.slice(0,100);selectedFile=null;saveLocal();renderApp();toast('Post saved in this browser.');
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
 const blob=new Blob([JSON.stringify({version:'Forgeware 0.03',exportedAt:new Date().toISOString(),profile:state.profile,posts:remoteMode?[]:state.posts,bookmarks:state.bookmarks},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='revenant-forgeware-002.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Demo data exported.');
}
async function resetDemo() {
 if(!confirm('Reset the local demo posts, profile, and settings? This cannot be undone.'))return;
 storage.removeItem(STATE_KEY);state.profile=null;state.posts=demoSeeds.map(p=>({...p,comments:p.comments.map(c=>({...c}))}));state.bookmarks=[];state.likedLocal=[];saveLocal();profile=null;showGate('profile');
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
    else if(db&&user){gateStep='';showGate('');navigate('/home');renderApp()}
    else showGate('profile');
   }
   else if(action==='auth-signup'){authMode='signup';showGate('auth')}
   else if(action==='auth-login'){authMode='login';showGate('auth')}
   else if(action==='demo-profile')showGate('profile');
   else if(action==='quick-local'){const name='Reven_'+Math.random().toString(36).slice(2,7);pendingLocalProfile={username:name,initials:initials(name)};generatedDemoPassword=makeDemoPassword();showGate('local-credentials')}
   else if(action==='copy-demo-credentials'){const text='Username: '+((pendingLocalProfile||{}).username||'')+'\\nDemo password: '+generatedDemoPassword;if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);toast('Demo details copied.')}else toast('Clipboard unavailable; select and copy the details manually.')}
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
   if(action==='like'){await toggleLike(id);return}
   if(action==='comments'){if(commentsOpen.has(String(id)))commentsOpen.delete(String(id));else commentsOpen.add(String(id));renderApp();if(remoteMode&&commentsOpen.has(String(id)))await refreshComments(id);return}
   if(action==='share'){const p=state.posts.find(x=>String(x.id)===String(id));const text=p?(p.body||p.text||'')+' — Revenant':'';if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);toast('Post text copied. Shareable public URLs come later.')}else toast('Clipboard not available in this browser.');return}
   if(action==='bookmark'){await saveBookmark(id);return}
   if(action==='post-menu'){const p=state.posts.find(x=>String(x.id)===String(id));if(remoteMode&&user&&p?.user_id===user.id){if(confirm('Delete this post?')){const {error}=await db.from('posts').delete().eq('id',id).eq('user_id',user.id);if(error)throw error;await refreshRemotePosts();toast('Post deleted.')}}else if(!remoteMode&&p?.own){if(confirm('Delete this local demo post?')){state.posts=state.posts.filter(x=>String(x.id)!==String(id));saveLocal();renderApp()}}else showModal('Post options','Report, mute, and other moderation actions need the full moderation system. Use the community rules while testing.');return}
   if(action==='reel-next'){currentReel=(currentReel+1)%reels.length;renderApp();return}
   if(action==='reel-prev'){currentReel=(currentReel+reels.length-1)%reels.length;renderApp();return}
   if(action==='reel-like'){state.likedReels=state.likedReels||[];state.likedReels.includes(currentReel)?state.likedReels=state.likedReels.filter(i=>i!==currentReel):state.likedReels.push(currentReel);saveLocal();renderApp();return}
   if(action==='reel-comment'){toast('Reel comments will be connected when real video posts are added.');return}
   if(action==='reel-share'){toast('Reel share links are planned for a later version.');return}
   if(action==='join-community'){showModal(btn.getAttribute('data-name')||'Community','This is a community preview. Persistent memberships will come with the communities backend.');return}
   if(action==='signout'){if(db){await db.auth.signOut()}user=null;profile=null;remoteMode=false;showGate('auth');return}
   if(action==='open-auth'){authMode='login';showGate(db?'auth':'profile');return}
   if(action==='reset-onboarding'){storage.removeItem(AGE_KEY);storage.removeItem(TERMS_KEY);showGate('age');return}
   if(action==='close-modal'||action==='modal-backdrop'){if(action==='modal-backdrop'&&event.target!==btn)return;$('#modal-root').innerHTML='';return}
  } catch(err){console.error(err);toast(err.message||'That action failed. Check the backend configuration.')}
 }
 if(event.target.id==='account-button')navigate('/settings');
 if(event.target.id==='open-font-import')$('#font-upload')?.click();
 if(event.target.id==='save-profile') {
  const input=$('#profile-name');const username=(input?.value||'').trim();
  if(username.length<2){toast('Display name must have at least two characters.');return}
  try{
   if(remoteMode&&db&&user){const {data,error}=await db.from('profiles').update({username}).eq('id',user.id).select('id,username,avatar_url,bio').single();if(error)throw error;setProfile(data)}
   else {state.profile={...(state.profile||{}),username,initials:initials(username)};saveLocal();setProfile(state.profile)}
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
document.addEventListener('change',async event=>{
 if(event.target.id==='post-file') {
  const file=event.target.files?.[0];if(!file)return;
  if(!safeImage(file)){toast('Choose PNG, JPEG, GIF, WebP, or AVIF.');event.target.value='';return}
  const limit=remoteMode?8_000_000:1_200_000;
  if(file.size>limit){toast(remoteMode?'For now, images must be smaller than 8 MB.':'Demo attachments must be smaller than 1.2 MB.');event.target.value='';return}
  selectedFile=file;
  const reader=new FileReader();reader.onload=()=>{const holder=$('#attachment-preview');if(holder)holder.innerHTML='<div class="attachment-preview"><img src="'+String(reader.result)+'" alt="Attachment preview"><button type="button" id="remove-attachment" aria-label="Remove attachment">×</button></div>'};reader.readAsDataURL(file);
 }
 if(event.target.id==='font-upload')importFont(event.target.files?.[0]);
 if(event.target.id==='reduce-motion'){state.reduceMotion=event.target.checked;saveLocal();document.body.classList.toggle('reduce-motion',state.reduceMotion)}
});
document.addEventListener('click',event=>{
 if(event.target.id==='remove-attachment'){selectedFile=null;$('#attachment-preview').innerHTML='';const file=$('#post-file');if(file)file.value=''}
});
$('#command-form').addEventListener('submit',event=>{
 event.preventDefault();const value=$('#command-input').value.trim();if(!value)return;const key=value.toLowerCase().split(/\s+/)[0];
 if(routes.has(key)){navigate(key);$('#command-input').value='';return}
 if(value.startsWith('/')){navigate('/help');toast('Command not found. Open /help to see available commands.');$('#command-input').value='';return}
 navigate('/posts');setTimeout(()=>{const area=$('#post-body');if(area){area.value=value;area.focus();toast('Search is not connected yet; your text was placed in the post composer.')}},80);$('#command-input').value='';
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
 if(remoteMode&&['/home','/feed','/posts'].includes(routeFromHash()))await refreshRemotePosts();
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