let $$ = q => [...document.querySelectorAll(q)];
let $ = q => document.querySelector(q);

let copyStyle = (origin, destination, dummy) => {
    for(let i = 0; i < origin.length; i++){
	let name = origin[i];
	let v = origin.getPropertyValue(name);
	let p = origin.getPropertyPriority(name);
	if(  dummy.getPropertyValue(name) == v
	     && dummy.getPropertyPriority(name) == p)
	    continue;
	destination.setProperty(name, v, p);
    }
};

let protect = n => parseInt(n*1000)/1000;

let easeOutSine = function (x, t, b, c, d) {
    return c * Math.sin(t/d * (Math.PI/2)) + b;
};

let animatedToRemove = new Set();
function animateCSS(node, animationNames, callback) {
    let persistPrefix = 'persist-';
    let isPersist = x => x.startsWith(persistPrefix);
    let persists = animationNames.filter(isPersist).map(x => x.slice(persistPrefix.length));
    let isTemp = x => persists.indexOf(x) == -1;
    animationNames = animationNames.filter(x => !isPersist(x));
    node.classList.add('animated', ...animationNames);

    function handleAnimationEnd() {
        node.classList.remove('animated', ...animationNames.filter(isTemp));
	animationNames.filter(x => !isTemp(x)).map(x => animatedToRemove.add(x));
        node.removeEventListener('animationend', handleAnimationEnd);
        node.removeEventListener('transitionend', handleAnimationEnd);

        if (typeof callback === 'function') callback();
    }

    node.addEventListener('animationend', handleAnimationEnd);
    node.addEventListener('transitionend', handleAnimationEnd);
}

let copyElementAsChildOf = (eOrigin, destination) => {
    let e = eOrigin.cloneNode(true);
    let dRect = destination.getBoundingClientRect();
    let eRect = eOrigin.getBoundingClientRect();

    let dRatioX = protect(destination.offsetWidth / dRect.width);
    let dRatioY = protect(destination.offsetHeight / dRect.height);

    console.log({dRatioX, dRatioY});
    
    copyStyle(
	window.getComputedStyle(eOrigin),
	e.style,
	window.getComputedStyle(destination.querySelector('.dummyTopEl'))
    );
    e.style.position = 'absolute';
    e.style.left = (dRatioX * (eRect.left - dRect.left))+'px';
    e.style.top = (dRatioY * (eRect.top - dRect.top))+'px';
    
    destination.appendChild(e);
    // eOrigin.remove();
    eOrigin.style.opacity = 0;
    eOrigin.className = '';
};

let autoResize = () => {
    let elem = document.querySelector('section');
    let rx = window.innerWidth / elem.offsetWidth;
    let ry = window.innerHeight / elem.offsetHeight;
    let r = Math.min(rx, ry);

    document.body.style.zoom = r;
};

window.addEventListener("resize", autoResize);

let gridRelatedWork = () => {
    let exampleSection = document.querySelector('section');
    let grid = document.querySelector('#grid');
    let l = 100;
    let xi = 0;
    for(let x=0; x < exampleSection.offsetWidth; x += l){
    let yi = 0;
	for(let y=0; y < exampleSection.offsetHeight; y += l){
	    let el = document.createElement('div');
	    el.style.left = x+'px';
	    el.style.width = el.style.height = l+'px';
	    el.style.top = y+'px';
	    el.innerHTML =
		`<span class='x' style="
                      position: absolute;
                      left: 0; top: 7px;
                      width: ${l}px;
                      transform: translate(-50%, 0%);
                      display: block;
                      text-align: center;
                   "><span style='background: white'>( ${xi} ; ${yi} )</span></span>`;
	    grid.appendChild(el);
	    yi ++;
	}
	xi ++;
    }
    
    $$('section *[r]')
	.map(x => {x.style.position='absolute'; x.style.right = ((+x.getAttribute('r'))*l)+'px';});
    $$('section *[b]')
	.map(x => {x.style.position='absolute'; x.style.bottom = ((+x.getAttribute('b'))*l)+'px';});
    
    $$('section *[x]')
	.map(x => {x.style.position='absolute'; x.style.left = ((+x.getAttribute('x'))*l)+'px';});
    $$('section *[y]')
	.map(x => {x.style.position='absolute'; x.style.top = ((+x.getAttribute('y'))*l)+'px';});
};

document.addEventListener('keydown', e => {
    if(e.keyCode==18)
	document.getElementById('grid').style.visibility = 'visible';
});
document.addEventListener('keyup', e => {
    console.log(e.keyCode);
    if(e.keyCode==39)
	nextMove();
    else if(e.keyCode==37)
	previousSection();
    else if(e.keyCode==18)
	document.getElementById('grid').style.visibility = 'hidden';
});

document.addEventListener('click', e => {
    nextMove();
});


let eventTElem = (n, t) => {
    let l = n.getAttribute('at-'+t).split(' ').map(x => x.trim());
    let ol = l.filter(x => x != 'in' && x != 'out');
    return {
	isIn: l.indexOf('in') !== -1,
	isOut: l.indexOf('out') !== -1,
	actions: ol
    };
};
let timesOfElem = n =>
    [...n.attributes].map(x => +(x.name.match(/^at-([\d.]+)$/)||[])[1]).filter(t => !isNaN(t));


let setupSection = (section, whash = true) => {
    if(whash)
	window.location.hash = [...section.parentNode.children].filter(x => x.tagName == 'SECTION').indexOf(section);
    section.removeAttribute('time');
    let any = [...section.querySelectorAll('*')];
    any.map(n => (n.classList.remove('hidden'), [n, timesOfElem(n)]))
	.filter(([_,t]) => t.length)
	.map(([n, t]) => [n, eventTElem(n, t[0])])
        .filter(([n, {isIn}]) =>
		isIn
		&& n.classList.add('hiddenIn'));
    any.map(n =>
	    [...animatedToRemove].map(c => {
		if(n.classList.contains(c))
		    n.classList.remove(c);
	    })
	   );
};


window.addEventListener('load', () => {
    gridRelatedWork();
    let g = document.getElementById('grid');
    g.style.visibility = 'hidden';
    
    $$('section').map(s => {
	let el = document.createElement('div');
	el.classList.add('dummyTopEl');
	s.appendChild(el);
	// s.classList.add('active');
    });
    
    let sections = $$('body section');
    sections.map(section => {
	let toBePulled = [...section.children].map(x => [...x.querySelectorAll('*[n]')]).flat();
	console.log(section, 'toBePulled', toBePulled);
	[...toBePulled].map(x => copyElementAsChildOf(x, section));
    });
    
    
    // [...$$('section')].map(x => x.classList.remove('active'));
    let [slideNum, animNum] = window.location.hash.slice(1).split('-').map(x => +x);
    let firstSection = document.querySelectorAll('section')[
	slideNum || 0
    ];
    setupSection(firstSection, false);
    if(!isNaN(animNum))
	setAnimNum(firstSection, animNum);
    firstSection.classList.add('active');
    [...$$('section > .dummyTopEl')].map(x => x.remove());

    $$('pre').map(x => Prism.highlightElement(x));

    setTimeout(autoResize(),100);
});

let setAnimNum = (section, animNum) => {
    setupSection(section);    
    [...section.querySelectorAll('*')]
	.map(n => {
	    let lows = timesOfElem(n)
		.filter(i => i <= animNum)
		.map(i => eventTElem(n, i));
	    let low = lows.filter(x => x.isIn || x.isOut).pop()||{};
	    if(low.isOut)
		n.classList.add('hidden');
	    if(low.isIn)
		n.classList.remove('hiddenIn');
	    let animationNames = lows.map(x => x.actions).flat();
	    let persistPrefix = 'persist-';
	    let isPersist = x => x.startsWith(persistPrefix);
	    let persists = animationNames.filter(isPersist).map(x => x.slice(persistPrefix.length));	
	    persists.map(prop => {
		let before = n.style.transition;
		n.classList.add('notransition');
		n.classList.add(prop);
		animatedToRemove.add(prop);
		let _ = n.offsetHeight;
		n.classList.remove('notransition');
		// setTimeout(() => (n.style.transition = before), 100)
	    });
	});
    
    window.location.hash = [...section.parentNode.children].filter(x => x.tagName == 'SECTION').indexOf(section) + '-' + animNum;
    section.setAttribute('time', animNum);
};
let prevAnim = () => {
    let section = getActiveSection();
    let times = [...section.querySelectorAll('*')].map(timesOfElem).flat();
    let cur = section.getAttribute('time');
    let n = Math.max(...times.filter(x => x < cur));
    if(n == -Infinity)
	return false;
    setAnimNum(section, n);
    console.log("TIME=", n);
    return true;
};

let translate  = (a, b, done) => {
    b.classList.remove('hidden');

    console.log('translate', a, b);
    ramjet.transform( a, b, {
	easing: ramjet.easeInOut,
	duration: 700,
	done: function () {
	    b.classList.remove('hidden');
	    done();
	}
    });

    a.classList.add('hidden');
    b.classList.add('hidden');
};
let hideFade = (e) => {
    e.classList.add('hidden-opacity');
    setTimeout(
	() => {
	    e.classList.add('hidden');
	    e.classList.remove('hidden-opacity');
	},
	500
    );
};

let sectionMorph = (a, b) => {
    b.classList.add('active');
    let as = [...a.children];
    let bs = [...b.children];
    console.log('sectionMorph', as, bs);
    a.classList.add('active');
    bs.map(x => x.classList.add('hidden'));
    b.classList.add('active');

    let fs = [];
    let left = 0;
    let done = () => {
	left--;
	if(left == 0){
	    as.map(x => x.classList.remove('hidden'));
	    a.classList.remove('active');
	    nextMove(0);
	}
    };

    let bsOriginal = bs.map(x => x);
    let others = [];
    
    for(let i in as){
	let iv = as[i];
	let n = iv.getAttribute('n');
	let bvi = n ? bs.findIndex(x => x.getAttribute('n') == n) : -1;
	if(bvi !== -1){
	    let bv = bs.splice(bvi, 1)[0];
	    left++;
	    console.log(iv, bv);
	    fs.push([bv, _ => translate(iv, bv, done)]);
	}else{
	    others.push(_ => hideFade(iv));
	}
    }
    bs.forEach(x => {
	fs.push([x, _ => {
	    x.classList.remove('hidden');
	    // animateCSS(x, ['fadeIn'], () => {});
	}]);
    });
    bsOriginal.map(b => fs.find(([x]) => x==b)[1]());
    others.map(x => x());
    if(left === 0){
	left++;
	done();
    }
};

let getActiveSection = () => $('section.active') || ($('section').classList.add('active'), $('section'));

let nextSection = () => {
    let a = getActiveSection();
    setupSection(a.nextSibling);
    sectionMorph(a, a.nextSibling);
};
let previousSection = () => {
    if(prevAnim())
	return;
    let a = getActiveSection();
    let prev = a.previousSibling;
    if(prev.tagName!='SECTION')
	prev = a;
    setupSection(prev);
    prev.classList.add('active');
    a.classList.remove('active');
};


let nextMove = (forceNextTime = null) => {
    let active = getActiveSection();
    let currentTime = +active.getAttribute('time');
    currentTime = isNaN(currentTime) ? -Infinity : currentTime;

    let times = $$('section.active *')
	.map(timesOfElem).flat()
        .filter(t => t > currentTime);

    let nextTime = forceNextTime !== null ? forceNextTime : Math.min(...times);

    if(nextTime == Infinity)
	return nextSection();

    let atNextTime = $$('section.active *')
	.filter(x => x.hasAttribute('at-'+nextTime));

    console.log('atNextTime', atNextTime);
    
    // $$('section.active *[at-'+nextTime+']')
    atNextTime.map(n => {
	let event = eventTElem(n, nextTime);
	if(event.actions.length){
	    animateCSS(n, event.actions, () => {
		if(event.isOut)
		    n.classList.add('hidden');
	    });
	    if(event.isIn)
		n.classList.remove('hiddenIn');
	}else if(event.isOut)
		n.classList.add('hidden');
	else if(event.isIn)
	    n.classList.remove('hiddenIn');
	// event.actions && n.classList.add(...event.actions);
    });

    window.location.hash = [...active.parentNode.children].filter(x => x.tagName == 'SECTION').indexOf(active) + '-' + nextTime;
    active.setAttribute('time', nextTime);
};


window.addEventListener("hashchange", function(){
    let page = +(window.location.hash.slice(1).split('-')[0]);
    $('#pagenum div').innerHTML = page || '';
});

