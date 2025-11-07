// ============================= [Local Debug Tools]
var force

function force_data(raw) {
  if (Object.keys(data.wishlist).length != 0) {
    console.log("Data already parsed!")
    return false
  }
  force = raw
  console.log("Parsing data...")
  var status = prepare_wishlist()
  if (status && Object.keys(data.wishlist).length != 0) {
    update_mode()
    document.getElementById("title").addEventListener("click",title_click)
    document.body.dataset.ready = true
    console.log("Force setup complete!")
    return true
  }
  console.log("Failed to parse data...")
  return false
}

// ============================= [Primary Data Object]
var data = {
  "labels":[["Primary","Fulfilled","Removed","Restricted"],["Edit","Order","Create","Export"]],
  "ratings":[
    {"symbol":"fa-check-square","color":"lime","description":"This is something that I have high interest in and think is worth the price."},
    {"symbol":"fa-question-circle","color":"yellow","description":"This is something that I am hesitant for people to buy due to high price or poor practicality."},
    {"symbol":"fa-exclamation-circle","color":"orange","description":"This is something that I believe is not worth the price or I would not put to good use."},
    {"symbol":"fa-warning","color":"red","description":"This is something that I have interest in, but would actively not like people to buy due to being unreasonably priced or something unlikely to be put to good use."},
    {"symbol":"fa-info-circle","color":"white","description":"This entry is for information purposes. It may be a currently unreleased item, a secondary wishlist, or a store front I have general interest in."}
  ],
  "lists":[
    {"symbol":"fa-list","color":"yellow"},
    {"symbol":"fa-list","color":"lime"},
    {"symbol":"fa-list","color":"red"}
  ],
  "hidden":[
    {"symbol":"fa-user-secret","color":"red"},
    {"symbol":"fa-user-secret","color":"lime"}
  ],
  "defaults":{
    "rating":4,
    "hidden":0,
    "status":2,
    "order":0,
    "name":"Placeholder Title",
    "price":"$??.??",
    "link":"",
    "description":"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lacinia at quis risus sed vulputate odio. Ut etiam sit amet nisl.",
    "comment":"",
    "warning":""
  },
  "wishlist":{},
  "pass":0,
  "priv":0,
  "warn":0,
  "list":0,
  "edit":0,
  "item":0,
  "mode":0
}

// ============================= [Compiled Template Library]
var template = {
  "list_header":nunjucks.compile(`{% for label in labels %}<button data-index="{{ loop.index0 }}">{{ label }}</button>{% endfor %}`),
  "list_main":nunjucks.compile(`
    {% for item in items %}
      {% if (item.status == list) %}
      <div class="content_list_item" data-list="{{ list }}" data-index="{{ loop.index0 }}" {% if list == 0 %}style="order:{{ item.order }}"{% endif %}>
        {% if list == 0 %}
        <div>{{ item.order }}</div>
        {% endif %}
        <button data-details class="fa fa-question" aria-hidden="true"></button>
        <div class="fa {{ data.ratings[item.rating].symbol }}" style="color:{{ data.ratings[item.rating].color }}" aria-hidden="true"></div>
        <div>{{ item.price }}</div>
        <div>{% if item.warning %}<i class="fa fa-warning" aria-hidden="true" style="color:red"></i>{% endif %}{{ item.name | safe }}</div>
      </div>
      {% endif %}
    {% endfor %}`),
  "list_editor":nunjucks.compile(`
    {% for item in items %}
      {% if (edit == 0 or item.status == 0) %}
      <div class="content_list_item" data-edit="{{ edit }}" data-index="{{ loop.index0 }}" {% if edit == 1 %}style="order:{{ item.order }}"{% endif %}>
        {% if edit == 1 %}
        <div>{{ item.order }}</div>
        <button data-input="order-next" class="fa fa-chevron-down" aria-hidden="true"></button>
        <button data-input="order-last" class="fa fa-chevron-up" aria-hidden="true"></button>
        {% else %}
        <button data-input="delete" class="fa fa-times" aria-hidden="true"></button>
        <button data-details class="fa fa-question" aria-hidden="true"></button>
        <button data-input="status" class="fa {{ data.lists[item.status | replace(3,0)].symbol }}" style="color:{{ data.lists[item.status | replace(3,0)].color }}" aria-hidden="true"></button>
        <button data-input="hidden" class="fa {{ data.hidden[item.hidden].symbol }}" style="color:{{ data.hidden[item.hidden].color }}" aria-hidden="true"></button>
        {% endif %}
        <button data-input="rating" class="fa {{ data.ratings[item.rating].symbol }}" style="color:{{ data.ratings[item.rating].color }}" aria-hidden="true"></button>
        <div>{{ item.price }}</div>
        <div>{% if item.warning %}<i class="fa fa-warning" aria-hidden="true" style="color:red"></i>{% endif %}{{ item.name | safe }}</div>
      </div>
      {% endif %}
    {% endfor %}`),
  "list_lock":nunjucks.compile(`
    <div id="lock_container">
      <div id="lock_title">PASSWORD REQUIRED</div>
      <div id="lock_input">
        <input id="lock_password" type="password" placeholder="Please enter password to continue...">
        <button id="lock_submit">Submit</button>
      </div>
    </div>`),
  "item_details":nunjucks.compile(`
    <div class="namerow">
      <h2 class="name">{{ item.name | safe }}</h2>
    </div>
    <hr>
    <div class="boxrow">
      <div class="box">Price: {{ item.price }}</div>
      <div class="boxgroup">
        {% if not (item.link == "") %}
        <a class="box" href="{{ item.link }}" target="_blank">Link <i class="fa fa-external-link-square" aria-hidden="true"></i></a>
        {% endif %}
        <button data-close class="box">Close <i class="fa fa-times-circle" aria-hidden="true"></i></button>
      </div>
    </div>
    {% if item.warning %}
    <div class="section warning">
      <h4>Warning</h4>
      <p>{{ item.warning | safe }}</p>
    </div>
    {% endif %}
    <div class="section" style="color:{{ data.ratings[item.rating].color }}">
      <h4>Rating <i class="fa {{ data.ratings[item.rating].symbol }}" aria-hidden="true"></i></h4>
      <p>{{ data.ratings[item.rating].description | safe }}</p>
    </div>
    <div class="section">
      <h4>Description</h4>
      <p>{{ item.description | safe }}</p>
    </div>
    {% if item.comment %}
    <div class="section">
      <h4>Comment</h4>
      <p>{{ item.comment | safe }}</p>
    </div>
    {% endif %}`),
  "item_editor":nunjucks.compile(`
    <div class="namerow">
      <input data-input="name" class="name" placeholder="Item has no name specified..." value="{{ item.name | safe }}"></input>
      <button data-close class="box">Close <i class="fa fa-times-circle" aria-hidden="true"></i></button>
    </div>
    <hr>
    {% for section in [{"id":"price","rows":1},{"id":"link","rows":1},{"id":"warning","rows":5},{"id":"description","rows":5},{"id":"comment","rows":5}] %}
    <div class="section">
      <h4>{{ section.id | capitalize }}</h4>
      <textarea data-input="{{ section.id }}" placeholder="Item has no {{ section.id }} specified..." rows="{{ section.rows }}">{{ item[section.id] | safe }}</textarea>
    </div>
    {% endfor %}`)
}

// ============================= [General Functions]

//[On Load] Create necessary listeners and call setup functions when the page was loaded
window.onload = ()=>{
  var status = prepare_wishlist()
  if (status && Object.keys(data.wishlist).length != 0) {
    update_mode()
    document.getElementById("title").addEventListener("click",title_click)
    document.body.dataset.ready = true
  }
}

//[Prepare Wishlist] Attempt to query, decrypt, and load wishlist data
function prepare_wishlist() {
  var attempts = 3, error = false;
  do {
    error = false;
    try {
      var request = new XMLHttpRequest()
      request.open("GET","wishlist.txt?_="+new Date().getTime(),false)
      request.send()
    } catch (e) {
      error = e
    }
    if (error || request.status != 200) {
      console.error(`Failed to fetch wishlist data! `+(error?`Error occurred: ${error}`:`Status code ${request.status}`))
    }
  } while ((error || request.status != 200) && --attempts && !force)
  if ((!error && request.status == 200) || force) {
    try {
      data.wishlist = JSON.parse(CryptoJS.AES.decrypt(force ?? request.responseText,window.location.hash).toString(CryptoJS.enc.Utf8))
      data.pass = window.location.hash
      title_error()
      return true
    } catch (e) {
      title_error("Wishlist data could not be parsed! Please double check your link is correct...")
    }
  } else {
    title_error("Wishlist data could not be loaded! Please try again later...")
  }
  return false
}

//[Title Error] Update or reset the website title to be the specified error message (or not one)
function title_error(message) {
  var parent = document.getElementById("title"), child = parent.querySelector("span")
  if (!parent.dataset.default) {parent.dataset.default = child.innerText}
  parent.classList.toggle("error",!!message)
  child.innerText = (!!message) ? message : parent.dataset.default
}

//[Title Click] Handle clicks of the website title and toggle mode when a triple click is detected
function title_click(event) {
  var title=event.target,click=[...(title.dataset.click ?? "0,0").split(","),Date.now()]
  if (click[2]-click[0]>1000) {title.dataset.click=click.slice(1).join(",");return}
  delete title.dataset.click
  update_mode(!data.mode)
}

//[Update Mode] Handle changing the website mode to and from editor mode
function update_mode(mode) {
  data.mode = mode = +!!(mode??data.mode)
  document.body.classList.toggle("editor",mode)
  update_container(0)
  update_header(mode)
  if (mode) {update_editor(data.edit,true)} else {update_list(data.list,true)}
}

//[Update Header] Handle changing the website header when changing website modes
function update_header(mode) {
  var header = document.getElementById("content_header")
  header.innerHTML = template.list_header.render({"labels":data.labels[mode]})
  header.children.forEach(e=>e.addEventListener("click",mode?update_editor:update_list))
}

//[Update Container] Handle switching the currently displayed container
function update_container(state) {
  document.getElementById("content_body").children.forEach((e,i)=>e.classList.toggle("visible",i==state))
}

//[Update Details] Update the item detail container based on specified data or an event object
function update_details(event) {
  var index = data.item = +(event?.target?.parentElement?.dataset?.index ?? event ?? -1)
  update_container(+(index!=-1))
  if (index == -1) {return}
  document.getElementById("content_detail").innerHTML = template[(data.mode)?"item_editor":"item_details"].render({"item":data.wishlist.general[index],"data":data})
  document.querySelectorAll("#content_detail [data-close]").forEach(e=>e.addEventListener("click",()=>{update_details(-1)}))
  document.querySelectorAll("#content_detail [data-input]").forEach(e=>e.addEventListener("input",update_data))
}

//[Update Lock] Render and prepare the password entry interface
function update_lock() {
  document.getElementById("content_list").innerHTML = template.list_lock.render()
  document.getElementById("lock_password").addEventListener("input",()=>{unlock_warn(false)})
  document.getElementById("lock_submit").addEventListener("click",unlock_main)
}

//[Unlock Main] When a password is submitted, attempt decryption and handle result as necessary
function unlock_main() {
  var input = document.getElementById("lock_password"), password = input.value; input.value = ""
  try {
    data.wishlist.general.push(...JSON.parse(CryptoJS.AES.decrypt(data.wishlist.private,password).toString(CryptoJS.enc.Utf8)).map(e=>Object.assign(e,{"hidden":1})))
    data.wishlist.private = false
    data.priv = password
    if (data.mode) {update_editor(data.edit,true)} else {update_list(data.list,true)}
  }
  catch (e) {if (password.length!=0) {unlock_warn(true)}}
}

//[Unlock Warn] Handle toggling the title warning class on and off
function unlock_warn(state) {
  document.getElementById("lock_title").classList.toggle("warn",state)
  if (state) {clearTimeout(data.warn);data.warn=setTimeout(unlock_warn,5000,false)}
}

//[Clone Object]
function clone_object(n){if(null==n||"object"!=typeof n)return n;if(n instanceof Array){for(var r=[],e=0;e<n.length;++e)r[e]=clone_object(n[e]);return r}var o={};for(var e in n)o[e]=clone_object(n[e]);return o}

// ============================= [Primary Mode]

//[Update List] Update the currently displayed list based on specified data or an event object
function update_list(event,force) {
  var list = +(event.target?.dataset.index ?? event ?? 0)
  if (list == data.list && !force) {return} else {data.list = list}
  document.getElementById("content_header").children.forEach((e,i)=>e.classList.toggle("selected",i==data.list))
  if (typeof data.wishlist.private == "string" && list == 3) {update_lock();return}
  document.getElementById("content_list").innerHTML = template.list_main.render({"items":data.wishlist.general,"list":list,"data":data})
  document.querySelectorAll(".content_list_item [data-details]").forEach(e=>e.addEventListener("click",update_details))
}

// ============================= [Editor Mode]

//[Update List] Handle events and button inputs as necessary while in editor mode
function update_editor(event,force) {
  var edit = +(event?.target?.dataset?.index ?? event ?? 0)
  if (typeof data.wishlist.private == "string") {edit = -1} else {if (edit == -1) {edit = 0};if (!data.wishlist.private) {Object.assign(data.wishlist,{"general":data.wishlist.general.map(e=>Object.assign({},data.defaults,e)),"private":true})}}
  if (edit == data.edit && !force) {return}
  if (edit == 2) {update_create()} else if (edit == 3) {update_export()}
  if (edit >= 2) {edit = data.edit} else {data.edit = edit}
  document.getElementById("content_header").children.forEach((e,i)=>e.classList.toggle("selected",edit!=-1&&(i==edit||i>=2)))
  if (edit == -1) {update_lock();return}
	document.getElementById("content_list").innerHTML = template.list_editor.render({"items":data.wishlist.general,"edit":edit,"data":data})
  document.querySelectorAll(".content_list_item [data-details]").forEach(e=>e.addEventListener("click",update_details))
  document.querySelectorAll(".content_list_item [data-input]").forEach(e=>e.addEventListener("click",update_data))
}

//[Update Create] Create a new empty wishlist element 
function update_create() {data.wishlist.general.push(Object.assign({},data.defaults))}

//[Update Export] Format and export wishlist data to the clipboard
function update_export() {
  if (data.priv === 0) {window.alert("[Error] Private password is undefined");return}
  if (data.pass === 0) {window.alert("[Error] Public password is undefined");return}
  var format = Object.assign(clone_object(data.wishlist),{"private":[]})
  for(var i=format.general.length;i--;){format.general[i].hidden&&format.private.unshift(...format.general.splice(i,1))}
  console.log("[Initial data object]:",format)
  format.private = CryptoJS.AES.encrypt(JSON.stringify(format.private),data.priv).toString()
  console.log("[After private encrypt]:",format)
  format = CryptoJS.AES.encrypt(JSON.stringify(format),data.pass).toString()
  console.log("[After final encrypt]:",format)
  navigator.clipboard.writeText(format)
  window.alert("Wishlist data exported to clipboard...")
}

//[Update Data] Handle events to update wishlist item data and alter input elements via the editor interface
function update_data(event) {
  var index = +(event?.target?.parentElement?.dataset?.index ?? data.item),
      input = event.target.dataset.input,
      wishlist = data.wishlist.general,
      item = wishlist[index]
  if (index == -1) {return}
  switch (input) {
    case "order-next":
    case "order-last":
      var o=wishlist.filter(e=>e.status==0).sort((a,b)=>a.order-b.order),t=o.indexOf(item),s=input=="order-next"?1:-1;
      if(input=="order-next"?t==o.length-1:t==0){return}
      [o[t],o[t+s]]=[o[t+s],o[t]]
      o.forEach((e,i)=>{e.order=i+1})
      break;
    case "delete":
      if(!window.confirm(`Are you sure you want to delete this item?\n${item.price} - ${item.name}`)){return}
      wishlist.splice(index,1)
      break;
    case "status":
      item.status=(item.status+1-item.hidden)%3+item.hidden
      if(item.status!=0){item.order=0}
      Object.assign(event.target,{"className":`fa ${data.lists[item.status%3].symbol}`,"style":`color:${data.lists[item.status%3].color}`})
      return;
    case "hidden":
      item.hidden^=1
      if(item.status%3==0){item.status=item.hidden*3}
      Object.assign(event.target,{"className":`fa ${data.hidden[item.hidden].symbol}`,"style":`color:${data.hidden[item.hidden].color}`})
      return;
    case "rating":
      item.rating=(item.rating+1)%5
      Object.assign(event.target,{"className":`fa ${data.ratings[item.rating].symbol}`,"style":`color:${data.ratings[item.rating].color}`})
      return;
    default:
      item[input]=event.target.value
      break;
  }
  update_editor(data.edit,true)
}