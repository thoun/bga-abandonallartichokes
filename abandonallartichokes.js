/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * AbandonAllArtichokes implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * abandonallartichokes.js
 *
 * AbandonAllArtichokes user interface script
 *
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

define([
    "dojo","dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
],
function (dojo, declare) {
    return declare("bgagame.abandonallartichokes", ebg.core.gamegui, {
	constructor: function() {
            console.log('abandonallartichokes constructor');

            this.cardwidth = 150;
            this.cardheight = 200;
	    // the values must be the same in
	    // - gamedatas
	    // - HTML *.tpl file (div id)
	    // - stock constructor (below)
	    // - php code (material.inc.php)
	    // TODO: make this nicer
	    this.Stock = {
		GardenStack: 'garden_stack',
		GardenRow: 'garden_row',
		Hand: 'hand',
		Deck: 'deck',
		Discard: 'discard',
		DisplayedCard: 'displayed_card',
		PlayedCard: 'played_card',
		Compost: 'compost',
	    };
	    // this needs to match the names in material.inc.php
	    this.Notification = {
		CardMoved: "card_moved",
		DrewHand: "drew_hand",
		RefilledGardenRow: "refilled_garden_row",
	    };
	    // this needs to match the values in abandonallartichokes.action.php
	    this.AjaxActions = {
		Harvest: 'harvestCard',
		LeekChooseOpponent: 'leekChooseOpponent',
		LeekTakeCard: 'leekTakeCard',
		PlayCard: 'playCard',
		Pass: 'pass',
	    };
        },
        /*
            setup:

            This method must set up the game user interface according to current game situation specified
            in parameters.

            The method is called each time the game interface is displayed to a player, ie:
            _ when the game starts
            _ when a player refreshes the game page (F5)

            "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
        */

        setup: function(gamedatas) {
            console.log( "Starting game setup" );

	    // TODO: remove
            console.log(gamedatas);

	    this.counter = {};
            // Setting up player boards
            for (var player_id in gamedatas.players)
            {
                var player = gamedatas.players[player_id];
		var player_board_div = $('player_board_' + player_id);
		dojo.place(this.format_block('jstpl_player_board', { id: player_id }), player_board_div);

		this.counter[player_id] = {};
		this.counter[player_id]['hand'] = new ebg.counter();
		this.counter[player_id]['hand'].create("hand_" + player_id);
		this.counter[player_id]['hand'].setValue(gamedatas.counters[player_id].hand);
		this.counter[player_id]['deck'] = new ebg.counter();
		this.counter[player_id]['deck'].create("deck_" + player_id);
		this.counter[player_id]['deck'].setValue(gamedatas.counters[player_id].deck);
		this.counter[player_id]['discard'] = new ebg.counter();
		this.counter[player_id]['discard'].create("discard_" + player_id);
		this.counter[player_id]['discard'].setValue(gamedatas.counters[player_id].discard);
            }

	    const stock_constructor = [
		{ name: this.Stock.GardenRow, callback: 'onGardenRowSelect', selectionMode: 1 },
		{ name: this.Stock.Hand, callback: 'onPlayerHandSelect', selectionMode: 1 },
		{ name: this.Stock.DisplayedCard, callback: 'onDisplayedCardSelect', selectionMode: 0 },
		{ name: this.Stock.PlayedCard, callback: null, selectionMode: 0 },
		{ name: this.Stock.Compost, callback: null, selectionMode: 0 },
	    ];

	    this.stock = new Object();
	    for (var stock_entry of stock_constructor) {
		console.log(this.stock);
		console.log(stock_entry);
		this.stock[stock_entry.name] = this.setupCardStocks(stock_entry.name, stock_entry.callback);
		this.stock[stock_entry.name].setSelectionMode(stock_entry.selectionMode);
		this.addCardsToStock(this.stock[stock_entry.name], this.gamedatas[stock_entry.name]);
	    }

            this.setupNotifications();

            console.log( "Ending game setup" );
        },


        ///////////////////////////////////////////////////
        //// Game & client states

        // Initialize a card stock
        // Arguments: div id, function which occurs when the card selection changes
        setupCardStocks: function(id, selectionChangeFunctionName) {
            var stock = new ebg.stock();
            stock.create(this, $(id), this.cardwidth, this.cardheight);
            for (var vegetable_id = 1; vegetable_id < 12; vegetable_id++) {
                stock.addItemType(vegetable_id, vegetable_id, g_gamethemeurl + 'img/' + vegetable_id + '.png', vegetable_id);
            }
	    if (selectionChangeFunctionName != null) {
		dojo.connect(stock, 'onChangeSelection', this, selectionChangeFunctionName);
	    }
            return stock;
        },

	// Add an array of server cards to a particular stock
        addCardsToStock: function(stock, cards) {
	    stock.removeAll();
            Object.values(cards).forEach(function(card) {
                stock.addToStockWithId(card.type, card.id);
            });
	},

	onDisplayedCardSelect: function(control_name, item_id) {
	    var items = this.stock[this.Stock.DisplayedCard].getSelectedItems();
	    debugger
	    if (items.length > 0) {
                //if( this.checkAction('playCard', true)) {
                //var card_id = items[0].id;
		//this.changeState(this.AjaxActions.PlayCard, { id: card_id });
                //}
		//else {
		this.showMessage(_("You can't select cards from the display area now."), "error");
                this.stock[this.Stock.DisplayedCard].unselectAll();
	    }
	},

	onPlayerHandSelect: function(control_name, item_id) {
	    var items = this.stock[this.Stock.Hand].getSelectedItems();

	    if (items.length > 0) {
		// TODO: this will break for eggplant
                if( this.checkAction('playCard', true)) {
                    var card_id = items[0].id;
		    this.changeState(this.AjaxActions.PlayCard, { id: card_id });
                }
		else {
		    this.showMessage(_("You can't play cards from your hand now."), "error");
		}
                this.stock[this.Stock.Hand].unselectAll();
	    }
	},

	onGardenRowSelect: function(control_name, item_id) {
	    var items = this.stock[this.Stock.GardenRow].getSelectedItems();

	    if (items.length > 0) {
                if( this.checkAction('harvestCard', true)) {
                    var card_id = items[0].id;
		    this.changeState(this.AjaxActions.Harvest, { id: card_id });
                }
		else {
		    this.showMessage(_("You can't harvest cards now."), "error");
		}
                this.stock[this.Stock.GardenRow].unselectAll();
	    }
	},

        // onEnteringState: this method is called each time we are entering into a new game state.
        //                  You can use this method to perform some user interface changes at this moment.
        //
        onEnteringState: function( stateName, args )
        {
            console.log( 'Entering state: '+stateName );

            switch( stateName )
            {

            /* Example:

            case 'myGameState':

                // Show some HTML block at this game state
                dojo.style( 'my_html_block_id', 'display', 'block' );

                break;
           */


            case 'dummmy':
                break;
            }
        },

        // onLeavingState: this method is called each time we are leaving a game state.
        //                 You can use this method to perform some user interface changes at this moment.
        //
        onLeavingState: function( stateName )
        {
            console.log( 'Leaving state: '+stateName );

            switch( stateName )
            {

            /* Example:

            case 'myGameState':

                // Hide the HTML block we are displaying only during this game state
                dojo.style( 'my_html_block_id', 'display', 'none' );

                break;
           */


            case 'dummmy':
                break;
            }
        },

        // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
        //                        action status bar (ie: the HTML links in the status bar).
        //
        onUpdateActionButtons: function(stateName, args) {
            console.log('onUpdateActionButtons: ' + stateName);

            if (this.isCurrentPlayerActive()) {
                switch (stateName) {
		case this.AjaxActions.PlayCard:
		    this.addActionButton('pass', _('Pass'), 'onPass');
		    break;
		case this.AjaxActions.LeekChooseOpponent:
		    for (var player_id in this.gamedatas.players) {
			if (player_id == this.player_id) {
			    continue;
			}
			if (this.hasCards(player_id) == 0) {
			    continue;
			}
			this.addActionButton('player_' + this.gamedatas.players[player_id].player_no, _('Choose ') + this.gamedatas.players[player_id].name, 'onLeekChooseOpponent_' + this.gamedatas.players[player_id].player_no);
		    }
		    break;
		case this.AjaxActions.LeekTakeCard:
		    this.addActionButton('leekTake', _('Take card'), 'onLeekTake');
		    this.addActionButton('leekLeave', _('Give card back'), 'onLeekDecline');
		    break;
		}
	    }
        },

	onLeekChooseOpponent_1: function() {
	    this.changeState(this.AjaxActions.LeekChooseOpponent, { opponent_id: this.player_no_to_id(1) });
	},

	onLeekChooseOpponent_2: function() {
	    this.changeState(this.AjaxActions.LeekChooseOpponent, { opponent_id: this.player_no_to_id(2) });
	},

	onLeekChooseOpponent_3: function() {
	    this.changeState(this.AjaxActions.LeekChooseOpponent, { opponent_id: this.player_no_to_id(3) });
	},

	onLeekChooseOpponent_4: function() {
	    this.changeState(this.AjaxActions.LeekChooseOpponent, { opponent_id: this.player_no_to_id(4) });
	},

	hasCards: function(player_id) {
	    return this.counter[player_id]['deck'].getValue() + this.counter[player_id]['discard'].getValue();
	},

	player_no_to_id: function(player_no) {
	    for (var player_id in this.gamedatas.players) {
		if (this.gamedatas.players[player_id].player_no == player_no) {
		    return player_id;
		}
	    }
	},

	onPass: function() {
	    this.changeState(this.AjaxActions.Pass);
	},

	onLeekTake: function() {
	    this.changeState(this.AjaxActions.LeekTakeCard, { take_card: true });
	},

	onLeekDecline: function() {
	    this.changeState(this.AjaxActions.LeekTakeCard, { take_card: false });
	},
	
        ///////////////////////////////////////////////////
        //// Player's action

        /*

            Here, you are defining methods to handle player's action (ex: results of mouse click on
            game objects).

            Most of the time, these methods:
            _ check the action is possible at this game state.
            _ make a call to the game server

        */

        /* Example:

        onMyMethodToCall1: function( evt )
        {
            console.log( 'onMyMethodToCall1' );

            // Preventing default browser reaction
            dojo.stopEvent( evt );

            // Check that this action is possible (see "possibleactions" in states.inc.php)
            if( ! this.checkAction( 'myAction' ) )
            {   return; }

            this.ajaxcall( "/abandonallartichokes/abandonallartichokes/myAction.html", {
                                                                    lock: true,
                                                                    myArgument1: arg1,
                                                                    myArgument2: arg2,
                                                                    ...
                                                                 },
                         this, function( result ) {

                            // What to do after the server call if it succeeded
                            // (most of the time: nothing)

                         }, function( is_error) {

                            // What to do after the server call in anyway (success or failure)
                            // (most of the time: nothing)

                         } );
        },

        */


	// Notifications
        setupNotifications: function()
        {
            console.log( 'notifications subscriptions setup' );

	    dojo.subscribe(this.Notification.CardMoved, this, "notif_cardMoved");
	    dojo.subscribe(this.Notification.DrewHand, this, "notif_drewHand");
	    dojo.subscribe(this.Notification.RefilledGardenRow, this, "notif_refilledGardenRow");

	    this.notifqueue.setSynchronous(this.Notification.CardMoved, 800);
        },

	notif_cardMoved: function(notification) {
	    console.log(this.Notification.CardMoved + ' notification');
	    console.log(notification);
	    this.showCardPlay(notification.args.player_id,
			      notification.args.origin, notification.args.origin_arg,
			      notification.args.destination, notification.args.destination_arg,
			      notification.args.card, notification.args.counters);
	},

	notif_drewHand: function(notification) {
	    console.log(this.Notification.DrewHand + ' notification');
	    console.log(notification);
	    this.stock[this.Stock.Hand].removeAll();
	    this.addCardsToStock(this.stock[this.Stock.Hand], notification.args.cards);
	    this.updateCounter(notification.args.counters);
	},

	notif_refilledGardenRow: function(notification) {
	    console.log(this.Notification.RefilledGardenRow + ' notification');
	    console.log(notification);
	    for (var card of notification.args.new_cards) {
		this.stock[this.Stock.GardenRow].addToStockWithId(card.type, card.id);
	    }
	},

	// Utility functions

	changeState: function(targetState, args = {}) {
	    args.lock = true;
            this.ajaxcall("/abandonallartichokes/abandonallartichokes/" + targetState + ".html", args,
			  this, function(result) {  }, function (is_error) { } );
	},

	showCardPlay: function(player_id, from, from_arg, to, to_arg, card, counters) {
	    if (to == this.Stock.Compost) {
		// only last card of compost visible
		this.stock[to].removeAll();
	    }

	    if (this.isVisible(from, from_arg)) {
		if (this.isVisible(to, to_arg)) {
		    this.moveVisibleToVisible(from, to, card);
		} else {
		    this.moveVisibleToPanel(from, player_id, card);
		}
	    } else {
		if (this.isVisible(to, to_arg)) {
		    this.movePanelToVisible(player_id, to, card);
		}
	    }
		    
	    this.updateCounter(counters);
	},

	isVisible: function(location, location_arg) {
	    switch (location) {
	    case this.Stock.Deck:
	    case this.Stock.Discard:
	    case this.Stock.GardenStack:
		return false;
	    case this.Stock.GardenRow:
	    case this.Stock.DisplayedCard:
	    case this.Stock.PlayedCard:
	    case this.Stock.Compost:
		return true;
	    case this.Stock.Hand:
		if (location_arg == this.player_id) {
		    return true;
		}
	    default:
		console.log("unhandled case '" + location + "' in isVisible()");
		return false;
	    }
	},

	moveVisibleToVisible: function(from, to, card) {
	    this.stock[to].addToStockWithId(card.type, card.id, from + '_item_' + card.id);
	    this.stock[from].removeFromStockById(card.id, to);
	},

	moveVisibleToPanel: function(from, player_id, card) {
	    this.slideToObject(from + '_item_' + card.id, 'player_board_' + player_id);
	    this.stock[from].removeFromStockById(card.id, 'player_board_' + player_id);
	},

	movePanelToVisible: function(player_id, to, card) {
	    this.stock[to].addToStockWithId(card.type, card.id, 'player_board_' + player_id);
	},
  
	updateCounter: function(counters) {
	    for (var player_id in counters) {
		this.counter[player_id].hand.setValue(counters[player_id].hand);
		this.counter[player_id].deck.setValue(counters[player_id].deck);
		this.counter[player_id].discard.setValue(counters[player_id].discard);
	    }
	}
   });
});

