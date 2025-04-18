/**
* @license
* Package: @easepick/lock-plugin
* Version: 1.2.1
* https://easepick.com/
* Copyright 2025 Rinat G.
* 
* Licensed under the terms of GNU General Public License Version 2 or later. (http://www.gnu.org/licenses/gpl.html)
*/
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@easepick/datetime'), require('@easepick/base-plugin')) :
    typeof define === 'function' && define.amd ? define(['exports', '@easepick/datetime', '@easepick/base-plugin'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.easepick = global.easepick || {}, global.easepick, global.easepick));
})(this, (function (exports, datetime, basePlugin) { 'use strict';

    class LockPlugin extends basePlugin.BasePlugin {
        priority = 1;
        binds = {
            onView: this.onView.bind(this),
        };
        options = {
            minDate: null,
            maxDate: null,
            minDays: null,
            maxDays: null,
            selectForward: null,
            selectBackward: null,
            presets: true,
            inseparable: false,
            filter: null,
        };
        /**
         * Returns plugin name
         *
         * @returns String
         */
        getName() {
            return 'LockPlugin';
        }
        /**
         * - Called automatically via BasePlugin.attach() -
         * The function execute on initialize the picker
         */
        onAttach() {
            if (this.options.minDate) {
                this.options.minDate = new datetime.DateTime(this.options.minDate, this.picker.options.format, this.picker.options.lang);
            }
            if (this.options.maxDate) {
                this.options.maxDate = new datetime.DateTime(this.options.maxDate, this.picker.options.format, this.picker.options.lang);
                if (this.options.maxDate instanceof datetime.DateTime
                    && this.picker.options.calendars > 1
                    && this.picker.calendars[0].isSame(this.options.maxDate, 'month')) {
                    const d = this.picker.calendars[0].clone().subtract(1, 'month');
                    this.picker.gotoDate(d);
                }
            }
            if (this.options.minDays
                || this.options.maxDays
                || this.options.selectForward
                || this.options.selectBackward) {
                if (!this.picker.options.plugins.includes('RangePlugin')) {
                    const list = ['minDays', 'maxDays', 'selectForward', 'selectBackward'];
                    console.warn(`${this.getName()}: options ${list.join(', ')} required RangePlugin.`);
                }
            }
            this.picker.on('view', this.binds.onView);
        }
        /**
         * - Called automatically via BasePlugin.attach() -
         * The function execute on initialize the picker
         */
        onDetach() {
            this.picker.off('view', this.binds.onView);
        }
        /**
         * Function `view` event
         * Mark day elements as locked
         *
         * @param event
         */
        onView(event) {
            const { view, target, date } = event.detail;
            if (view === 'CalendarHeader') {
                if (this.options.minDate instanceof datetime.DateTime) {
                    if (date.isSameOrBefore(this.options.minDate, 'month')) {
                        target.classList.add('no-previous-month');
                    }
                }
                if (this.options.maxDate instanceof datetime.DateTime) {
                    if (date.isSameOrAfter(this.options.maxDate, 'month')) {
                        target.classList.add('no-next-month');
                    }
                }
            }
            if (view === 'CalendarDay') {
                const dateFrom = this.picker.datePicked.length ? this.picker.datePicked[0] : null;
                if (this.testFilter(date)) {
                    target.classList.add('locked');
                    return;
                }
                if (this.options.inseparable) {
                    if (this.options.minDays) {
                        const date1 = date.clone().subtract(this.options.minDays - 1, 'day');
                        const date2 = date.clone().add(this.options.minDays - 1, 'day');
                        let lockedInPrevDays = false;
                        let lockedInNextDays = false;
                        while (date1.isBefore(date, 'day')) {
                            if (this.testFilter(date1)) {
                                lockedInPrevDays = true;
                                break;
                            }
                            date1.add(1, 'day');
                        }
                        while (date2.isAfter(date, 'day')) {
                            if (this.testFilter(date2)) {
                                lockedInNextDays = true;
                                break;
                            }
                            date2.subtract(1, 'day');
                        }
                        if (lockedInPrevDays && lockedInNextDays) {
                            target.classList.add('not-available');
                        }
                    }
                    if (this.rangeIsNotAvailable(date, dateFrom)) {
                        target.classList.add('not-available');
                    }
                }
                if (this.dateIsNotAvailable(date, dateFrom)) {
                    target.classList.add('not-available');
                }
            }
            if (this.options.presets && view === 'PresetPluginButton') {
                const startDate = new datetime.DateTime(Number(target.dataset.start));
                const endDate = new datetime.DateTime(Number(target.dataset.end));
                const diff = endDate.diff(startDate, 'day');
                const lessMinDays = this.options.minDays && diff < this.options.minDays;
                const moreMaxDays = this.options.maxDays && diff > this.options.maxDays;
                if (lessMinDays || moreMaxDays
                    || this.lockMinDate(startDate)
                    || this.lockMaxDate(startDate)
                    || this.lockMinDate(endDate)
                    || this.lockMaxDate(endDate)
                    || this.rangeIsNotAvailable(startDate, endDate)) {
                    target.setAttribute('disabled', 'disabled');
                }
            }
        }
        /**
         * Checks availability date
         *
         * @param date
         * @param start
         * @returns Boolean
         */
        dateIsNotAvailable(date, start) {
            return this.lockMinDate(date)
                || this.lockMaxDate(date)
                || this.lockMinDays(date, start)
                || this.lockMaxDays(date, start)
                || this.lockSelectForward(date)
                || this.lockSelectBackward(date);
        }
        /**
         * Checks the date range for availability
         *
         * @param date1
         * @param date2
         * @returns Boolean
         */
        rangeIsNotAvailable(date1, date2) {
            if (!date1 || !date2)
                return false;
            const start = (date1.isSameOrBefore(date2, 'day') ? date1 : date2).clone();
            const end = (date2.isSameOrAfter(date1, 'day') ? date2 : date1).clone();
            while (start.isSameOrBefore(end, 'day')) {
                if (this.testFilter(start)) {
                    return true;
                }
                start.add(1, 'day');
            }
            return false;
        }
        /**
         * Handle `minDate` option
         *
         * @param date
         * @returns Boolean
         */
        lockMinDate(date) {
            return this.options.minDate instanceof datetime.DateTime
                ? date.isBefore(this.options.minDate, 'day')
                : false;
        }
        /**
         * Handle `maxDate` option
         *
         * @param date
         * @returns Boolean
         */
        lockMaxDate(date) {
            return this.options.maxDate instanceof datetime.DateTime
                ? date.isAfter(this.options.maxDate, 'day')
                : false;
        }
        /**
         * Handle `minDays` option
         *
         * @param date
         * @returns Boolean
         */
        lockMinDays(date, start) {
            if (this.options.minDays && start) {
                const minPrev = start
                    .clone()
                    .subtract(this.options.minDays - 1, 'day');
                const minNext = start
                    .clone()
                    .add(this.options.minDays - 1, 'day');
                return date.isBetween(minPrev, minNext);
            }
            return false;
        }
        /**
         * Handle `maxDays` option
         *
         * @param date
         * @returns Boolean
         */
        lockMaxDays(date, start) {
            if (this.options.maxDays && start) {
                const maxPrev = start
                    .clone()
                    .subtract(this.options.maxDays, 'day');
                const maxNext = start
                    .clone()
                    .add(this.options.maxDays, 'day');
                return !date.isBetween(maxPrev, maxNext);
            }
            return false;
        }
        /**
         * Handle `selectForward` option
         *
         * @param date
         * @returns Boolean
         */
        lockSelectForward(date) {
            if (this.picker.datePicked.length === 1 && this.options.selectForward) {
                const start = this.picker.datePicked[0].clone();
                return date.isBefore(start, 'day');
            }
            return false;
        }
        /**
         * Handle `selectBackward` option
         *
         * @param date
         * @returns Boolean
         */
        lockSelectBackward(date) {
            if (this.picker.datePicked.length === 1 && this.options.selectBackward) {
                const start = this.picker.datePicked[0].clone();
                return date.isAfter(start, 'day');
            }
            return false;
        }
        /**
         * Handle `filter` option
         *
         * @param date
         * @returns Boolean
         */
        testFilter(date) {
            return typeof this.options.filter === 'function'
                ? this.options.filter(date, this.picker.datePicked)
                : false;
        }
    }

    exports.LockPlugin = LockPlugin;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
