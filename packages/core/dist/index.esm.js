import { DateTime } from '@easepick/datetime';

class Calendar {
    picker;
    constructor(picker) {
        this.picker = picker;
    }
    /**
     * Render transferred date and view
     *
     * @param date
     * @param view
     */
    render(date, view) {
        if (!date) {
            date = new DateTime();
        }
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        // find function for view
        if (typeof this[`get${view}View`] === 'function') {
            this[`get${view}View`](date);
        }
    }
    /**
     * Function for `Container` view
     *
     * @param date
     */
    getContainerView(date) {
        this.picker.ui.container.innerHTML = '';
        if (this.picker.options.header) {
            this.picker.trigger('render', { date: date.clone(), view: 'Header' });
        }
        this.picker.trigger('render', { date: date.clone(), view: 'Main' });
        if (!this.picker.options.autoApply) {
            this.picker.trigger('render', { date: date.clone(), view: 'Footer' });
        }
    }
    /**
     * Function for `Header` view
     *
     * @param date
     */
    getHeaderView(date) {
        const element = document.createElement('header');
        if (this.picker.options.header instanceof HTMLElement) {
            element.appendChild(this.picker.options.header);
        }
        if (typeof this.picker.options.header === 'string') {
            element.innerHTML = this.picker.options.header;
        }
        this.picker.ui.container.appendChild(element);
        this.picker.trigger('view', { target: element, date: date.clone(), view: 'Header' });
    }
    /**
     * Function for `Main` view
     *
     * @param date
     */
    getMainView(date) {
        const main = document.createElement('main');
        this.picker.ui.container.appendChild(main);
        const calendars = document.createElement('div');
        calendars.className = `calendars grid-${this.picker.options.grid}`;
        for (let i = 0; i < this.picker.options.calendars; i++) {
            const month = document.createElement('div');
            month.className = 'calendar';
            calendars.appendChild(month);
            const calendarHeader = this.getCalendarHeaderView(date.clone());
            month.appendChild(calendarHeader);
            this.picker.trigger('view', {
                date: date.clone(),
                view: 'CalendarHeader',
                index: i,
                target: calendarHeader,
            });
            const dayNames = this.getCalendarDayNamesView();
            month.appendChild(dayNames);
            this.picker.trigger('view', {
                date: date.clone(),
                view: 'CalendarDayNames',
                index: i,
                target: dayNames,
            });
            const daysView = this.getCalendarDaysView(date.clone());
            month.appendChild(daysView);
            this.picker.trigger('view', {
                date: date.clone(),
                view: 'CalendarDays',
                index: i,
                target: daysView,
            });
            const calendarFooter = this.getCalendarFooterView(this.picker.options.lang, date.clone());
            month.appendChild(calendarFooter);
            this.picker.trigger('view', {
                date: date.clone(),
                view: 'CalendarFooter',
                index: i,
                target: calendarFooter,
            });
            this.picker.trigger('view', {
                date: date.clone(),
                view: 'CalendarItem',
                index: i,
                target: month,
            });
            date.add(1, 'month');
        }
        main.appendChild(calendars);
        this.picker.trigger('view', { date: date.clone(), view: 'Calendars', target: calendars });
        this.picker.trigger('view', { date: date.clone(), view: 'Main', target: main });
    }
    /**
     * Function for `Footer` view
     *
     * @param date
     */
    getFooterView(date) {
        const element = document.createElement('footer');
        const buttons = document.createElement('div');
        buttons.className = 'footer-buttons';
        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-button unit';
        cancelButton.innerHTML = this.picker.options.locale.cancel;
        buttons.appendChild(cancelButton);
        const applyButton = document.createElement('button');
        applyButton.className = 'apply-button unit';
        applyButton.innerHTML = this.picker.options.locale.apply;
        applyButton.disabled = true;
        buttons.appendChild(applyButton);
        element.appendChild(buttons);
        this.picker.ui.container.appendChild(element);
        this.picker.trigger('view', { date, target: element, view: 'Footer' });
    }
    /**
     * Function for `CalendarHeader` view
     *
     * @param date
     * @returns HTMLElement
     */
    getCalendarHeaderView(date) {
        const element = document.createElement('div');
        element.className = 'header';
        const monthName = document.createElement('div');
        monthName.className = 'month-name';
        monthName.innerHTML = `<span>${date.toLocaleString(this.picker.options.lang, { month: 'long' })}</span> ${date.format('YYYY')}`;
        element.appendChild(monthName);
        const prevMonth = document.createElement('button');
        prevMonth.className = 'previous-button unit';
        prevMonth.innerHTML = this.picker.options.locale.previousMonth;
        element.appendChild(prevMonth);
        const nextMonth = document.createElement('button');
        nextMonth.className = 'next-button unit';
        nextMonth.innerHTML = this.picker.options.locale.nextMonth;
        element.appendChild(nextMonth);
        return element;
    }
    /**
     * Function for `CalendarDayNames` view
     *
     * @param date
     * @returns HTMLElement
     */
    getCalendarDayNamesView() {
        const element = document.createElement('div');
        element.className = 'daynames-row';
        for (let w = 1; w <= 7; w++) {
            // 7 days, 4 is «Thursday» (new Date(1970, 0, 1, 12, 0, 0, 0))
            const dayIdx = 7 - 4 + this.picker.options.firstDay + w;
            const dayName = document.createElement('div');
            dayName.className = 'dayname';
            dayName.innerHTML = new Date(1970, 0, dayIdx, 12, 0, 0, 0)
                .toLocaleString(this.picker.options.lang, { weekday: 'short' });
            dayName.title = new Date(1970, 0, dayIdx, 12, 0, 0, 0)
                .toLocaleString(this.picker.options.lang, { weekday: 'long' });
            element.appendChild(dayName);
            this.picker.trigger('view', { dayIdx, view: 'CalendarDayName', target: dayName });
        }
        return element;
    }
    /**
     * Function for `CalendarDays` view
     *
     * @param date
     * @returns HTMLElement
     */
    getCalendarDaysView(date) {
        const element = document.createElement('div');
        element.className = 'days-grid';
        const offsetDays = this.calcOffsetDays(date, this.picker.options.firstDay);
        const totalDays = 32 - new Date(date.getFullYear(), date.getMonth(), 32).getDate();
        for (let idx = 0; idx < offsetDays; idx++) {
            const offsetDay = document.createElement('div');
            offsetDay.className = 'offset';
            element.appendChild(offsetDay);
        }
        for (let idx = 1; idx <= totalDays; idx++) {
            date.setDate(idx);
            const calendarDay = this.getCalendarDayView(date);
            element.appendChild(calendarDay);
            this.picker.trigger('view', { date, view: 'CalendarDay', target: calendarDay });
        }
        return element;
    }
    /**
     * Function for `CalendarDay` view
     *
     * @param date
     * @returns HTMLElement
     */
    getCalendarDayView(date) {
        const optionsDate = this.picker.options.date ? new DateTime(this.picker.options.date) : null;
        const today = new DateTime();
        const element = document.createElement('div');
        element.className = 'day unit';
        element.innerHTML = date.format('D');
        element.dataset.time = String(date.getTime());
        if (date.isSame(today, 'day')) {
            element.classList.add('today');
        }
        if ([0, 6].includes(date.getDay())) {
            element.classList.add('weekend');
        }
        if (this.picker.datePicked.length) {
            if (this.picker.datePicked[0].isSame(date, 'day')) {
                element.classList.add('selected');
            }
        }
        else {
            if (optionsDate && date.isSame(optionsDate, 'day')) {
                element.classList.add('selected');
            }
        }
        this.picker.trigger('view', { date, view: 'CalendarDay', target: element });
        return element;
    }
    /**
     * Function for `CalendarFooter` view
     *
     * @param lang
     * @param date
     * @returns HTMLElement
     */
    getCalendarFooterView(lang, date) {
        const element = document.createElement('div');
        element.className = 'footer';
        return element;
    }
    /**
     * Count the number of days of indentation
     *
     * @param date
     * @param firstDay
     * @returns Number
     */
    calcOffsetDays(date, firstDay) {
        let total = date.getDay() - firstDay;
        if (total < 0)
            total += 7;
        return total;
    }
}

class PluginManager {
    picker;
    instances = {};
    constructor(picker) {
        this.picker = picker;
    }
    /**
     * Initialize user-supplied plugins (if any)
     */
    initialize() {
        const list = [];
        this.picker.options.plugins.forEach((plugin) => {
            if (typeof plugin === 'function') {
                list.push(new plugin);
            }
            else if (typeof plugin === 'string'
                && typeof easepick !== 'undefined'
                && Object.prototype.hasOwnProperty.call(easepick, plugin)) {
                list.push(new easepick[plugin]);
            }
            else {
                console.warn(`easepick: ${plugin} not found.`);
            }
        });
        list.sort((a, b) => {
            if (a.priority > b.priority)
                return -1;
            if (a.priority < b.priority)
                return 1;
            if (a.dependencies.length > b.dependencies.length)
                return 1;
            if (a.dependencies.length < b.dependencies.length)
                return -1;
            return 0;
        });
        list.forEach(plugin => {
            plugin.attach(this.picker);
            this.instances[plugin.getName()] = plugin;
        });
    }
    /**
     * Return instance of plugin
     *
     * @param name
     * @returns Plugin
     */
    getInstance(name) {
        return this.instances[name];
    }
    /**
     * Add plugin «on the fly» to the picker
     *
     * @param name
     */
    addInstance(name) {
        if (!Object.prototype.hasOwnProperty.call(this.instances, name)) {
            if (typeof easepick !== 'undefined' && Object.prototype.hasOwnProperty.call(easepick, name)) {
                const plugin = new easepick[name];
                plugin.attach(this.picker);
                this.instances[plugin.getName()] = plugin;
                return plugin;
            }
            else if (this.getPluginFn(name) !== 'undefined') {
                const plugin = new (this.getPluginFn(name));
                plugin.attach(this.picker);
                this.instances[plugin.getName()] = plugin;
                return plugin;
            }
            else {
                console.warn(`easepick: ${name} not found.`);
            }
        }
        else {
            console.warn(`easepick: ${name} already added.`);
        }
        return null;
    }
    /**
     * Remove plugin from the picker
     *
     * @param name
     */
    removeInstance(name) {
        if (name in this.instances) {
            this.instances[name].detach();
        }
        return (delete this.instances[name]);
    }
    /**
     * Reload plugin
     *
     * @param name
     */
    reloadInstance(name) {
        this.removeInstance(name);
        return this.addInstance(name);
    }
    /**
     * Find plugin function by the name
     *
     * @param name
     * @returns Plugin
     */
    getPluginFn(name) {
        return [...this.picker.options.plugins]
            .filter(x => typeof x === 'function' && (new x).getName() === name)
            .shift();
    }
}

class Core {
    Calendar = new Calendar(this);
    PluginManager = new PluginManager(this);
    calendars = [];
    datePicked = [];
    cssLoaded = 0;
    binds = {
        hidePicker: this.hidePicker.bind(this),
        show: this.show.bind(this),
    };
    options = {
        doc: document,
        css: [],
        element: null,
        firstDay: 1,
        grid: 1,
        calendars: 1,
        lang: 'en-US',
        date: null,
        format: 'YYYY-MM-DD',
        readonly: true,
        autoApply: true,
        header: false,
        inline: false,
        scrollToDate: true,
        locale: {
            nextMonth: '<svg width="11" height="16" xmlns="http://www.w3.org/2000/svg"><path d="M2.748 16L0 13.333 5.333 8 0 2.667 2.748 0l7.919 8z" fill-rule="nonzero"/></svg>',
            previousMonth: '<svg width="11" height="16" xmlns="http://www.w3.org/2000/svg"><path d="M7.919 0l2.748 2.667L5.333 8l5.334 5.333L7.919 16 0 8z" fill-rule="nonzero"/></svg>',
            cancel: 'Cancel',
            apply: 'Apply',
        },
        documentClick: this.binds.hidePicker,
        plugins: [],
    };
    ui = {
        container: null,
        shadowRoot: null,
        wrapper: null,
    };
    version = "1.2.1";
    constructor(options) {
        const locales = { ...this.options.locale, ...options.locale };
        this.options = { ...this.options, ...options };
        this.options.locale = locales;
        this.handleOptions();
        this.ui.wrapper = document.createElement('span');
        this.ui.wrapper.style.display = 'none';
        this.ui.wrapper.style.position = 'absolute';
        this.ui.wrapper.style.pointerEvents = 'none';
        this.ui.wrapper.className = 'easepick-wrapper';
        this.ui.wrapper.attachShadow({ mode: 'open' });
        this.ui.shadowRoot = this.ui.wrapper.shadowRoot;
        this.ui.container = document.createElement('div');
        this.ui.container.className = 'container';
        if (this.options.zIndex) {
            this.ui.container.style.zIndex = String(this.options.zIndex);
        }
        if (this.options.inline) {
            this.ui.wrapper.style.position = 'relative';
            this.ui.container.classList.add('inline');
        }
        this.ui.shadowRoot.appendChild(this.ui.container);
        this.options.element.after(this.ui.wrapper);
        this.handleCSS();
        this.options.element.addEventListener('click', this.binds.show);
        this.on('view', this.onView.bind(this));
        this.on('render', this.onRender.bind(this));
        this.PluginManager.initialize();
        this.parseValues();
        if (typeof this.options.setup === 'function') {
            this.options.setup(this);
        }
        this.on('click', this.onClick.bind(this));
        const targetDate = this.options.scrollToDate ? this.getDate() : null;
        this.renderAll(targetDate);
    }
    /**
     * Add listener to container element
     *
     * @param type
     * @param listener
     * @param options
     */
    on(type, listener, options = {}) {
        this.ui.container.addEventListener(type, listener, options);
    }
    /**
     * Remove listener from container element
     *
     * @param type
     * @param listener
     * @param options
     */
    off(type, listener, options = {}) {
        this.ui.container.removeEventListener(type, listener, options);
    }
    /**
     * Dispatch an event
     *
     * @param type
     * @param detail
     * @returns
     */
    trigger(type, detail = {}) {
        return this.ui.container.dispatchEvent(new CustomEvent(type, { detail }));
    }
    /**
     * Destroy picker
     */
    destroy() {
        this.options.element.removeEventListener('click', this.binds.show);
        if (typeof this.options.documentClick === 'function') {
            document.removeEventListener('click', this.options.documentClick, true);
        }
        // detach all plugins
        Object.keys(this.PluginManager.instances).forEach(plugin => {
            this.PluginManager.removeInstance(plugin);
        });
        this.ui.wrapper.remove();
    }
    /**
     * Fired on render event
     *
     * @param event
     */
    onRender(event) {
        const { view, date } = event.detail;
        this.Calendar.render(date, view);
    }
    onView(event) {
        const { view, target } = event.detail;
        if (view === 'Footer' && this.datePicked.length) {
            const applyButton = target.querySelector('.apply-button');
            applyButton.disabled = false;
        }
    }
    /**
     *
     * @param element
     */
    onClickHeaderButton(element) {
        if (this.isCalendarHeaderButton(element)) {
            if (element.classList.contains('next-button')) {
                this.calendars[0].add(1, 'month');
            }
            else {
                this.calendars[0].subtract(1, 'month');
            }
            this.renderAll(this.calendars[0]);
        }
    }
    /**
     *
     * @param element
     */
    onClickCalendarDay(element) {
        if (this.isCalendarDay(element)) {
            const date = new DateTime(element.dataset.time);
            if (this.options.autoApply) {
                this.setDate(date);
                this.trigger('select', { date: this.getDate() });
                this.hide();
            }
            else {
                this.datePicked[0] = date;
                this.trigger('preselect', { date: this.getDate() });
                this.renderAll();
            }
        }
    }
    /**
     *
     * @param element
     */
    onClickApplyButton(element) {
        if (this.isApplyButton(element)) {
            if (this.datePicked[0] instanceof Date) {
                const date = this.datePicked[0].clone();
                this.setDate(date);
            }
            this.hide();
            this.trigger('select', { date: this.getDate() });
        }
    }
    /**
     *
     * @param element
     * @returns
     */
    onClickCancelButton(element) {
        if (this.isCancelButton(element)) {
            this.hide();
            return;
        }
    }
    /**
     * Fired on click event
     *
     * @param event
     */
    onClick(event) {
        const target = event.target;
        if (target instanceof HTMLElement) {
            const element = target.closest('.unit');
            if (!(element instanceof HTMLElement))
                return;
            this.onClickHeaderButton(element);
            this.onClickCalendarDay(element);
            this.onClickApplyButton(element);
            this.onClickCancelButton(element);
        }
    }
    /**
     * Determine if the picker is visible or not
     *
     * @returns Boolean
     */
    isShown() {
        return this.ui.container.classList.contains('inline')
            || this.ui.container.classList.contains('show');
    }
    /**
     * Show the picker
     *
     * @param event
     */
    show(event) {
        if (this.isShown())
            return;
        const target = event && 'target' in event ? event.target : this.options.element;
        const { top, left } = this.adjustPosition(target);
        //this.ui.container.style.position = 'absolute';
        this.ui.container.style.top = `${top}px`;
        this.ui.container.style.left = `${left}px`;
        this.ui.container.classList.add('show');
        this.trigger('show', { target: target });
    }
    /**
     * Hide the picker
     */
    hide() {
        this.ui.container.classList.remove('show');
        this.datePicked.length = 0;
        this.renderAll();
        this.trigger('hide');
    }
    /**
     * Set date programmatically
     *
     * @param date
     */
    setDate(date) {
        const d = new DateTime(date, this.options.format);
        this.options.date = d.clone();
        this.updateValues();
        if (this.calendars.length) {
            this.renderAll();
        }
    }
    /**
     *
     * @returns DateTime
     */
    getDate() {
        return this.options.date instanceof DateTime
            ? this.options.date.clone()
            : null;
    }
    /**
     * Parse `date` option or value of input element
     */
    parseValues() {
        if (this.options.date) {
            this.setDate(this.options.date);
        }
        else if (this.options.element instanceof HTMLInputElement && this.options.element.value.length) {
            this.setDate(this.options.element.value);
        }
        if (!(this.options.date instanceof Date)) {
            this.options.date = null;
        }
    }
    /**
     * Update value of input element
     */
    updateValues() {
        const date = this.getDate();
        const formatString = date instanceof Date ? date.format(this.options.format, this.options.lang) : '';
        const el = this.options.element;
        if (el instanceof HTMLInputElement) {
            el.value = formatString;
        }
        else if (el instanceof HTMLElement) {
            el.innerText = formatString;
        }
    }
    /**
     * Function for documentClick option
     * Allows the picker to close when the user clicks outside
     *
     * @param e
     */
    hidePicker(e) {
        let target = e.target;
        let host = null;
        if (target.shadowRoot) {
            target = e.composedPath()[0];
            host = target.getRootNode().host;
        }
        if (this.isShown()
            && this.options.inline === false
            && host !== this.ui.wrapper
            && target !== this.options.element) {
            this.hide();
        }
    }
    /**
     * Render entire picker layout
     *
     * @param date
     */
    renderAll(date) {
        this.trigger('render', { view: 'Container', date: (date || this.calendars[0]).clone() });
    }
    /**
     * Determines if the element is buttons of header (previous month, next month)
     *
     * @param element
     * @returns Boolean
     */
    isCalendarHeaderButton(element) {
        return ['previous-button', 'next-button'].some(x => element.classList.contains(x));
    }
    /**
     * Determines if the element is day element
     *
     * @param element
     * @returns Boolean
     */
    isCalendarDay(element) {
        return element.classList.contains('day');
    }
    /**
     * Determines if the element is the apply button
     *
     * @param element
     * @returns Boolean
     */
    isApplyButton(element) {
        return element.classList.contains('apply-button');
    }
    /**
     * Determines if the element is the cancel button
     *
     * @param element
     * @returns Boolean
     */
    isCancelButton(element) {
        return element.classList.contains('cancel-button');
    }
    /**
     * Change visible month
     *
     * @param date
     */
    gotoDate(date) {
        const toDate = new DateTime(date, this.options.format);
        toDate.setDate(1);
        this.calendars[0] = toDate.clone();
        this.renderAll();
    }
    /**
     * Clear date selection
     */
    clear() {
        this.options.date = null;
        this.datePicked.length = 0;
        this.updateValues();
        this.renderAll();
        this.trigger('clear');
    }
    /**
     * Handling parameters passed by the user
     */
    handleOptions() {
        if (!(this.options.element instanceof HTMLElement)) {
            this.options.element = this.options.doc.querySelector(this.options.element);
        }
        if (typeof this.options.documentClick === 'function') {
            document.addEventListener('click', this.options.documentClick, true);
        }
        if (this.options.element instanceof HTMLInputElement) {
            this.options.element.readOnly = this.options.readonly;
        }
        if (this.options.date) {
            this.calendars[0] = new DateTime(this.options.date, this.options.format);
        }
        else {
            this.calendars[0] = new DateTime();
        }
    }
    /**
     * Apply CSS passed by the user
     */
    handleCSS() {
        if (Array.isArray(this.options.css)) {
            this.options.css.forEach(cssLink => {
                const link = document.createElement('link');
                link.href = cssLink;
                link.rel = 'stylesheet';
                const onReady = () => {
                    this.cssLoaded++;
                    if (this.cssLoaded === this.options.css.length) {
                        this.ui.wrapper.style.display = '';
                    }
                };
                link.addEventListener('load', onReady);
                link.addEventListener('error', onReady);
                this.ui.shadowRoot.append(link);
            });
        }
        else if (typeof this.options.css === 'string') {
            const style = document.createElement('style');
            const styleText = document.createTextNode(this.options.css);
            style.appendChild(styleText);
            this.ui.shadowRoot.append(style);
            this.ui.wrapper.style.display = '';
        }
        else if (typeof this.options.css === 'function') {
            this.options.css.call(this, this);
            this.ui.wrapper.style.display = '';
        }
    }
    /**
     * Calculate the position of the picker
     *
     * @param element
     * @returns { top, left }
     */
    adjustPosition(element) {
        const rect = element.getBoundingClientRect();
        const wrapper = this.ui.wrapper.getBoundingClientRect();
        this.ui.container.classList.add('calc');
        const container = this.ui.container.getBoundingClientRect();
        this.ui.container.classList.remove('calc');
        let top = rect.bottom - wrapper.bottom;
        let left = rect.left - wrapper.left;
        if (typeof window !== 'undefined') {
            if (window.innerHeight < rect.top + container.height
                && top - container.height >= 0) {
                top = rect.top - wrapper.top - container.height;
            }
            if (window.innerWidth < rect.left + container.width
                && rect.right - container.width >= 0) {
                left = rect.right - wrapper.right - container.width;
            }
        }
        return {
            left,
            top,
        };
    }
}

var core = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Core: Core,
    create: Core
});

export { Core, Core as create, core as easepick };
