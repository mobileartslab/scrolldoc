/*
 * differential-scroll
 * version: 0.0.1
 * https://github.com/Und3Rdo9/jquery-differential-scroll
 *
 * Copyright (c) 2016 Tim Bakkum
 * Licensed under the MIT license.
 */
/* globals console */

;(function($) {

    "use strict";

    // define default once
    var defaults = {            
        breakpoint :        '(min-width: 40em)', // breakpoint to activate at
        offsetTop :         0, // extra offset from top to take into account (in case of fixed header for example)
        offsetBottom :      0, // extra bottom offset to take into account (in case of fixed footer for example) // to-do : add this values in calculations 
    };

    var DifferentialScroll = function(elem, options){
        this.elem = elem;
        this.$container = $(elem);
        this.options = options;
        this.metadata = this.$container.data('differential-scroll-options');

        this.$columns = this.$container.find('.differential-scroll-column');

        this.$smallestColumn = null;
        this.$tallestColumn = null;
        this.smallestSide   = '';
        this.tallestSide    = '';

        this.isLaunched     = false;
        this.fixedStatus    = '';

        this.windowTop      = '';
        this.windowHeight   = '';
        this.windowBottom   = '';

        this.containerTop   = '';

        // utility functions 
        this.getWindowTop = function(){
            return $(window).scrollTop();
        };

        this.getWindowHeight = function(){
            return $(window).height();
        };

        this.getWindowBottom = function(){
            return this.getWindowTop() + this.getWindowHeight();
        };

    };

    DifferentialScroll.prototype = {
        version :   '0.0.1',
        mediaQuery : window.matchMedia(defaults.breakpoint),

        mediaQueryCheck : function(mql){
            
             if(mql.matches === true){ // if our mediaQuery matches
                this.evalScrollPosition();
                if(this.isLaunched === false){
                    // attach scroll handlers

                    $(window).on('scroll.differentialScroll resize.differentialScroll', this.evalScrollPosition.bind(this));
                    this.isLaunched = true;
                }
            }
            else if(mql.matches === false){ // if the mediaQuery isn't active atm
                if(this.isLaunched === true){
                // remove handlers
                    $(window).off('scroll.differentialScroll resize.differentialScroll');
                    this.isLaunched = false;
                    
                }
                this.fixedStatus = '';
                this.unstyleContainer(); // remove positioning set by plugin
                this.unstyleColumns(); // remove positioning set by plugin
            }

        },
        
        init: function(){
            
            // merge user options with defaults 
            this.config = $.extend({}, defaults, this.options, this.metadata);
            // define mql object

            this.mediaQuery = window.matchMedia(this.config.breakpoint);
            
             var thatMediaQuery = this.mediaQuery;
            // add listener to conditionally toggle scroll and resize listeners
            this.mediaQuery.addListener( this.mediaQueryCheck.bind(this) );
            // check mediaQuery to determine whether to apply eventListeners 
            
            
            // and run for a first time
            this.mediaQueryCheck(thatMediaQuery);
            
            

            return this;
        },

        evalColumns : function(){
            if(this.$columns.length === 2){
                if(this.$columns.first().outerHeight() < this.$columns.last().outerHeight()){
                    this.$smallestColumn     = this.$columns.first();
                    this.$tallestColumn      = this.$columns.last();
                    this.smallestSide       = 'left';
                    this.tallestSide        = 'right';

                }
                else if(this.$columns.first().outerHeight() > this.$columns.last().outerHeight()){
                    this.$smallestColumn     = this.$columns.last();
                    this.$tallestColumn      = this.$columns.first();
                    this.smallestSide       = 'right';
                    this.tallestSide        = 'left';
                }
                else if(this.$columns.first().outerHeight() === this.$columns.last().outerHeight()){
                    // both columns have the same height: both columns can scroll at the same time!
                    this.$smallestColumn     = null;
                    console.log('columns are the same height, no need to apply differential scroll effect');
                }
                
            }
            else{
                this.$smallestColumn     = null;
                console.error('you must have two columns!');
            }
        },

        styleContainer : function(){
            this.$container.css({
                'position'  : 'relative',
                'overflow'  : 'hidden',
                'height'    : this.$tallestColumn.outerHeight(),
            });
        },

        unstyleContainer : function(){
            this.$container.css({
                'position'  : 'initial', // to-do : not sure if best way
                'overflow'  : 'initial', // to-do : not sure if best way
                'height'    : 'auto',
            });
        },

        unstyleColumns : function(){
            this.$columns.css({
                'position'  : 'relative',
                'top'       : 'auto',
                'bottom'    : 'auto',
                'right'     : 'auto',
                'left'      : 'auto'
            });
            
        },

        fixToTopScreen : function(){
            this.fixedStatus = "top-screen";
            this.$smallestColumn.css({
                'position'  : 'absolute', // 'fixed',
                'top'       : ((this.getWindowTop() - this.containerTop) + 'px'), //offset of scrollContainer to top - window scroll bottom
                'bottom'    : 'auto',
            }).css(this.smallestSide, 0);

           // console.log('toggleFixTop');
        },

        fixToBottomContainer : function(){
            if(this.fixedStatus !== "bottom-container"){ // prevent from running multiple times if not necessary
                this.fixedStatus = "bottom-container";
                this.$smallestColumn.css({
                    'position'  : 'absolute',
                    'top'       : 'auto',
                    'bottom'    : '0',
                }).css(this.smallestSide, 0);

              //  console.log('toggleFixBottom container');
            }
        },

        fixToTopContainer : function(){
            if(this.fixedStatus !== "top-container"){ // prevent from running multiple times if not necessary
                this.fixedStatus = "top-container";
                this.$smallestColumn.css({
                    'position'  : 'absolute',
                    'top'       : '0',
                    'bottom'    : 'auto',
                }).css(this.smallestSide, 0);
                
               // console.log('toggleFix top Container');
            }
        },

        fixToBottomScreen : function (){
            this.fixedStatus = "middle";
            this.$smallestColumn.css({
                'position'  : 'absolute', // 'fixed',
                'top'       : 'auto',
                'bottom'    : ( ( this.$tallestColumn.outerHeight()- ( this.getWindowTop()  + this.getWindowHeight() - this.containerTop ) ) + 'px' ),
            }).css(this.smallestSide, 0);
           // console.log('toggle fix to bottom screen');
        },

        positionTallestColumn : function(){
            this.$tallestColumn.css({
                'position'  : 'absolute',
                'top'       : '0',
                'bottom'    : 'auto',
            }).css(this.tallestSide, 0);

           // console.log('positionTallestColumn');
        },

        evalScrollPosition : function(){

            // Get info on columns to determine whether to go ahead or not
            this.evalColumns();

            // Get window info once to reuse for comparisons
            this.windowTop      = this.getWindowTop();
            this.windowHeight   = this.getWindowHeight();
            this.windowBottom   = this.getWindowBottom();


            /* Check if smallest column is defined
             * columns might have equal height
             * or there might not be exactly 2 columns
             * then check if tallest column is bigger than window
             */ 
            if(this.$smallestColumn !== null && this.$tallestColumn.outerHeight() > this.windowHeight){

                    this.styleContainer();          // apply neccesary styles to container
                    this.positionTallestColumn();   // position the tallest column absolutely


                    this.containerTop   = this.$container.offset().top;
                    //this.containerBottom= this.$container.offset().top

                if(this.$smallestColumn.outerHeight() <= this.windowHeight){
                    /* Check if smallest column fits the screen
                     * adapt positioning based on scroll positioning
                     */
                    if(
                        this.windowTop <= this.containerTop
                    ){
                        /* We haven't scrolled past the top of the container 
                         * or we have scrolled back up past the top of the container
                         */ 
                        this.fixToTopContainer();
                    }
                    else if( 
                        this.windowTop > this.containerTop &&
                        this.windowTop < this.containerTop + (this.$tallestColumn.outerHeight() - this.$smallestColumn.outerHeight()) && 
                        this.windowTop < this.containerTop + this.$tallestColumn.outerHeight()
                    ){
                        /* - We scrolled past the top of the container
                         * - We haven't scrolled to the point where the smallest column
                         * fits exactly in the remaing visible container space
                         * - We haven't scrolled past the bottom of the container either
                         */
                         //console.log(this.windowBottom + 'wb <' + this.containerTop  + 'ct ' + this.$tallestColumn.outerHeight() );
                        this.fixToTopScreen();
                    }
                    else if( 
                        this.windowTop > this.containerTop &&
                        this.windowTop >= this.containerTop + (this.$tallestColumn.outerHeight() - this.$smallestColumn.outerHeight()) && 
                        this.windowBottom < this.containerTop + this.$tallestColumn.outerHeight()
                    ){
                        /* - We scrolled past the top of the container
                         * - We scrolled to the point where the smallest column
                         * fits exactly in the remaing visible container space
                         * - We haven't scrolled past the bottom of the container either
                         */
                        this.fixToBottomContainer();
                    }
                    else if(
                        this.windowTop > this.containerTop &&
                        this.windowBottom >= this.containerTop + this.$tallestColumn.outerHeight()
                    ){
                        /* - We scrolled past the top of the container
                         * - We scrolled past the bottom the container 
                         * (container is not visible on screen anymore)
                         */ 
                        this.fixToBottomContainer(); 
                    }
                }
                else if (this.$smallestColumn.outerHeight() > this.windowHeight){
                    /* Check if smallest column is bigger than the screen height
                     * adapt positioning based on scroll positioning
                     */
                    if(
                        this.windowTop <= this.containerTop
                    ){
                        /* We haven't scrolled past the top of the container 
                         * or we have scrolled back up past the top of the container
                         */ 
                        this.fixToTopContainer();
                    }
                    else if( 
                        this.windowTop > this.containerTop &&
                        this.windowBottom >= this.containerTop + this.$smallestColumn.outerHeight()  &&
                        this.windowBottom < this.containerTop + this.$tallestColumn.outerHeight()
                    ){
                        /* - We scrolled past the top of the container
                         * - We scrolled to/past the point where we can see the bottom of the smallest column
                         * - We haven't scrolled past the bottom of the container 
                         */
                        this.fixToBottomScreen();
                    }
                    else if(
                        this.windowTop > this.containerTop &&
                        this.windowBottom >= this.containerTop + this.$tallestColumn.outerHeight()
                    ){
                        /* - We scrolled past the top of the container
                         * - We scrolled past the bottom the container 
                         * (container is not visible on screen anymore)
                         */ 
                        this.fixToBottomContainer(); 
                    }
                }
            }
            else{
                // differential scroll behaviour not necessary 
                // removes styles just in case they were previously set
                this.unstyleColumns();
                this.unstyleContainer();
            }
        },
    };

    $.fn.differentialScroll = function(options){
        return this.each(function(){
            new DifferentialScroll(this, options).init();
        });
    };

}(jQuery));