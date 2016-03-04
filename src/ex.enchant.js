/**
 * @fileOverview
 * ex.enchant.js
 * @version 0.1 (2015/03/08)
 * @requires enchant.js v0.4.0 or later
 * @author Yoshito Imai
 *
 * @description
 * Action Game plugin for enchant.js
 *
 */

/**
 * ex namespace object
 * @type {Object}
 */
enchant.ex = {};

/**
 * @namespace
 */
enchant.Event = enchant.Event || {};

/**
 * 衝突が開始したとき発生するイベント。
 */
enchant.Event.COLLISION = 'collision';
/**
 * 衝突が開始したとき発生するイベント。
 */
enchant.Event.COLLISION_START = 'collisionstart';
/**
 * 衝突が終了したとき発生するイベント。
 */
enchant.Event.COLLISION_END = 'collisionend';
/**
 * 衝突している間、１フレーム毎に発生するイベント。
 */
enchant.Event.COLLISION_TICK = 'collisiontick';
/**
 * 左側が衝突したとき発生するイベント。
 */
enchant.Event.COLLISION_TO_LEFT = 'collisiontoleft';
/**
 * 右側が衝突したとき発生するイベント。
 */
enchant.Event.COLLISION_TO_RIGHT = 'collisiontoright';
/**
 * 下端が衝突したとき発生するイベント。
 */
enchant.Event.COLLISION_TO_BOTTOM = 'collisiontobottom';
/**
 * 上端が衝突したとき発生するイベント。
 */
enchant.Event.COLLISION_TO_TOP = 'collisiontotop';
/**
 * 左から衝突したとき発生するイベント。
 */
enchant.Event.COLLISION_FROM_LEFT = 'collisionfromleft';
/**
 * 右から衝突したとき発生するイベント。
 */
enchant.Event.COLLISION_FROM_RIGHT = 'collisionfromright';
/**
 * 下から衝突したとき発生するイベント。
 */
enchant.Event.COLLISION_FROM_BOTTOM = 'collisionfrombottom';
/**
 * 上から衝突したとき発生するイベント。
 */
enchant.Event.COLLISION_FROM_TOP = 'collisionfromtop';

/**
 * Action Game
 * Base class of enchant.Sprite
 * @scope enchant.ex.ExSprite.prototype
 */
enchant.ex.ExSprite = enchant.Class.create(enchant.Sprite, {
	/**
	 * @name enchant.ex.ExSprite
	 * @class
	 * Constructor of ExSprite
	 * @param {Integer} width Spriteの横幅.
	 * @param {Integer} height Spriteの高さ.
	 * @constructs
	 * @extends enchant.Sprite
	 */
	initialize: function(width, height){
		enchant.Sprite.call(this, width, height);

		// Event arguments
		this._followArg;
		// collision
		this._isCollision = false;
		this._collisionObjects = new Array();;
		this._collisionDuplicateObjects = new Array();
        // moved
        this._moved = {x: 0, y: 0};
		// history
		this._history = {x: this.x, y: this.y};
		// collision Based
		this.COLLISION = {
		    INTERSECT_BASED: "intersect",
		    WITHIN_BASED: "within"
		};
        this._collisionBased = this.COLLISION.INTERSECT_BASED;

		// Event Added to scene
		this.addEventListener(Event.ADDED_TO_SCENE, function(){
			this._history.x = this.x;
			this._history.y = this.y;
		});

		// for follow
		this.addEventListener(Event.ENTER_FRAME, function(){
            this._moved.x = this.x - this._history.x;
            this._moved.y = this.y - this._history.y;
			this._history.x = this.x;
			this._history.y = this.y;
		});

		// judge collision Target
		this.addEventListener(Event.ENTER_FRAME, function(){
			// collision Sprite
			if (this._collisionObjects.length > 0) {
				for (var i = 0; i < this._collisionObjects.length; i++) {
					(function(_this, value) {
						if (value instanceof Sprite) {
                            _this._judgeCollision(value);
						} else if (value instanceof Array) {
							for (var i = 0; i < value.length; i++) {
								arguments.callee(_this, value[i]);
							}
						} else if (value instanceof Group) {
							for (var i = 0; i < value.childNodes.length; i++) {
								arguments.callee(_this, value.childNodes[i]);
							}
						}
					})(this, this._collisionObjects[i]);
				}
			}
		});

	},
	/**
	 * 衝突判定の対象を設定します。
	 * @type enchant.Sprite | enchant.Group | Array
	 */
	collision: {
		set: function(value) {
			this._collisionObjects = new Array();
			this._collisionObjects.push(value);
		}
	},
	/**
	 * 衝突判定を行うSpriteを追加します。
	 * @param {enchant.Sprite | enchant.Group | Array} value 追加するSprite、またはそれを含むオブジェクト。
	 */
	addCollision: function(value) {
		this._collisionObjects.push(value);
	},
	_judgeCollision: function(target) {
	    var result = false;
        if (this._collisionBased == this.COLLISION.INTERSECT_BASED) {
            result = this.intersect(target);
        } else {
            result = this.within(target, (this.width + this.height) / 4 + (target.width + target.height) / 4);
        }
        if (result) {
            target._isCollision = true;
            this._dispatchEventCollision(target);
            if (this._moved.x < 0) this._dispatchEventMakeCollision(target, enchant.Event.COLLISION_TO_LEFT);
            if (this._moved.x > 0) this._dispatchEventMakeCollision(target, enchant.Event.COLLISION_TO_RIGHT);
            if (this._moved.y < 0) this._dispatchEventMakeCollision(target, enchant.Event.COLLISION_TO_TOP);
            if (this._moved.y > 0) this._dispatchEventMakeCollision(target, enchant.Event.COLLISION_TO_BOTTOM);
            if (target._moved.x > 0) this._dispatchEventMakeCollision(target, enchant.Event.COLLISION_FROM_LEFT);
            if (target._moved.x < 0) this._dispatchEventMakeCollision(target, enchant.Event.COLLISION_FROM_RIGHT);
            if (target._moved.y > 0) this._dispatchEventMakeCollision(target, enchant.Event.COLLISION_FROM_TOP);
            if (target._moved.y < 0) this._dispatchEventMakeCollision(target, enchant.Event.COLLISION_FROM_BOTTOM);
            return true;
        }
        target._isCollision = false;
        return false;
	},
    _dispatchEventCollision: function(target) {
        var e;
        var existCount = this._collisionDuplicateObjects.indexOf(target);
        if (existCount < 0) {
            this._dispatchEventMakeCollision(target, enchant.Event.COLLISION);
            this._dispatchEventMakeCollision(target, enchant.Event.COLLISION_START);
            this._collisionDuplicateObjects.push(target);
            //ターゲットとの衝突がなくなったときイベント生成
            this.addEventListener(Event.ENTER_FRAME, function() {
                var _arg = arguments.callee;
                if (!target._isCollision) {
                    this._collisionDuplicateObjects.splice(existCount);
                    this._dispatchEventMakeCollision(target, enchant.Event.COLLISION_END);
                    this.removeEventListener(Event.ENTER_FRAME, _arg);
                }
            });
        }
        this._dispatchEventMakeCollision(target, enchant.Event.COLLISION_TICK);
    },
    _dispatchEventMakeCollision: function(target, collisionName) {
        e = new Event(collisionName);
        e.collisionTarget = target;
        this.dispatchEvent(e);
    },
	/**
	 * ターゲットに指定したSpriteと一緒に移動します。
	 * @param {enchant.Sprite} target ターゲットを指定します。
	 * @example
	 * var target = new ExSprite(32, 32);
	 * core.rootScene.addChild(target);
	 *
	 * var sprite = new ExSprite(32, 32);
	 * sprite.follow(target);
	 * core.rootScene.addChild(sprite);
	 *
	 * target.tl.moveTo(10, 10, 10);
	 * //sprite.tl.moveTo(10, 10, 10);
	 *
	 */
	follow: function(target) {
		if (this._followArg) {
			this.removeEventListener(Event.ENTER_FRAME, this._followArg);
		}
		this.addEventListener(Event.ENTER_FRAME, function() {
			this._followArg = arguments.callee;
            this.x += target._moved.x;
            this.y += target._moved.y;
		});
	},
	/**
	 * followを解除します。
	 */
	unfollow: function() {
		if (this._followArg) {
			this.removeEventListener(Event.ENTER_FRAME, this._followArg);
		}
	},
	setCollisionIntersectBased: function() {
	    this._collisionBased = this.COLLISION.INTERSECT_BASED;
	},
	setCollisionWithinBased: function() {
	    this._collisionBased = this.COLLISION.WITHIN_BASED;
	}
});
/**
 * 親Nodeに対する垂直位置を指定します
 * @param {string} align top : 上端<br>middle : 中央<br>bottom : 下端
 * @example
 * var sprite = new ExSprite(32, 32);
 * sprite.setVerticalAlign('middle');
 * core.rootScene.addChild(sprite);
 */
enchant.ex.ExSprite.prototype.setVerticalAlign = function(align) {
    switch (align) {
        case "top":
            this.y = 0;
            break;
        case "center":
        case "middle":
            this.y = this.parentNode.height / 2 - this.height / 2;
            break;
        case "bottom":
            this.y = this.parentNode.height - this.height;
            break;
    }
};
/**
 * 親Nodeに対する水平位置を指定します
 * @param {string} align left : 左端<br>center : 中央<br>right : 右端
 * @example
 * var sprite = new ExSprite(32, 32);
 * sprite.setHorizontalAlign('center');
 * core.rootScene.addChild(sprite);
 */
enchant.ex.ExSprite.prototype.setHorizontalAlign = function(align) {
    switch (align) {
        case "left":
            this.x = 0;
            break;
        case "center":
            this.x = this.parentNode.width / 2 - this.width / 2;
            break;
        case "right":
            this.x = this.parentNode.width - this.width;
            break;
    }
};
