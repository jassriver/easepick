class DateTime extends Date {
    static parseDateTime(date, format = 'YYYY-MM-DD', lang = 'en-US') {
        if (!date)
            return new Date(new Date().setHours(0, 0, 0, 0));
        if (date instanceof DateTime)
            return date.toJSDate();
        if (date instanceof Date)
            return date;
        if (/^-?\d{10,}$/.test(String(date))) {
            return new Date(Number(date));
        }
        if (typeof date === 'string') {
            const matches = [];
            let m = null;
            while ((m = DateTime.regex.exec(format)) != null) {
                if (m[1] === '\\')
                    continue; // delete when regexp lookbehind
                matches.push(m);
            }
            if (matches.length) {
                const datePattern = {
                    year: null,
                    month: null,
                    shortMonth: null,
                    longMonth: null,
                    day: null,
                    hour: 0,
                    minute: 0,
                    second: 0,
                    ampm: null,
                    value: '',
                };
                if (matches[0].index > 0) {
                    datePattern.value += '.*?';
                }
                for (const [k, match] of Object.entries(matches)) {
                    const key = Number(k);
                    const { group, pattern } = DateTime.formatPatterns(match[0], lang);
                    datePattern[group] = key + 1;
                    datePattern.value += pattern;
                    datePattern.value += '.*?'; // any delimiters
                }
                const dateRegex = new RegExp(`^${datePattern.value}$`);
                if (dateRegex.test(date)) {
                    const d = dateRegex.exec(date);
                    const year = Number(d[datePattern.year]);
                    let month = null;
                    if (datePattern.month) {
                        month = Number(d[datePattern.month]) - 1;
                    }
                    else if (datePattern.shortMonth) {
                        month = DateTime.shortMonths(lang).indexOf(d[datePattern.shortMonth]);
                    }
                    else if (datePattern.longMonth) {
                        month = DateTime.longMonths(lang).indexOf(d[datePattern.longMonth]);
                    }
                    const day = Number(d[datePattern.day]) || 1;
                    const h = Number(d[datePattern.hour]);
                    let hours = !Number.isNaN(h) ? h : 0;
                    const m = Number(d[datePattern.minute]);
                    const minutes = !Number.isNaN(m) ? m : 0;
                    const s = Number(d[datePattern.second]);
                    const seconds = !Number.isNaN(s) ? s : 0;
                    const ampm = d[datePattern.ampm];
                    if (ampm && ampm === 'PM') {
                        hours += 12;
                        if (hours === 24) {
                            hours = 0;
                        }
                    }
                    return new Date(year, month, day, hours, minutes, seconds, 0);
                }
            }
        }
        return new Date(new Date().setHours(0, 0, 0, 0));
    }
    // @TODO
    // replace to regexp lookbehind when Safari support
    // https://caniuse.com/#feat=js-regexp-lookbehind
    // /(?<!\\)(Y{2,4}|M{1,4}|D{1,2}|H{1,2}|m{1,2}|s{1,2}])/g
    static regex = /(\\)?(Y{2,4}|M{1,4}|D{1,2}|H{1,2}|h{1,2}|m{1,2}|s{1,2}|A|a)/g;
    static MONTH_JS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    static shortMonths(lang) {
        return DateTime.MONTH_JS
            .map(x => new Date(2019, x).toLocaleString(lang, { month: 'short' }));
    }
    static longMonths(lang) {
        return DateTime.MONTH_JS
            .map(x => new Date(2019, x).toLocaleString(lang, { month: 'long' }));
    }
    /**
     * Returns group and pattern for match function
     *
     * @param token
     * @param lang
     * @returns { group, pattern }
     */
    static formatPatterns(token, lang) {
        switch (token) {
            case 'YY':
            case 'YYYY':
                return {
                    group: 'year',
                    pattern: `(\\d{${token.length}})`,
                };
            case 'M':
                return {
                    group: 'month',
                    pattern: '(\\d{1,2})',
                };
            case 'MM':
                return {
                    group: 'month',
                    pattern: '(\\d{2})',
                };
            case 'MMM':
                return {
                    group: 'shortMonth',
                    pattern: `(${DateTime.shortMonths(lang).join('|')})`,
                };
            case 'MMMM':
                return {
                    group: 'longMonth',
                    pattern: `(${DateTime.longMonths(lang).join('|')})`,
                };
            case 'D':
                return {
                    group: 'day',
                    pattern: '(\\d{1,2})',
                };
            case 'DD':
                return {
                    group: 'day',
                    pattern: '(\\d{2})',
                };
            case 'h':
            case 'H':
                return {
                    group: 'hour',
                    pattern: '(\\d{1,2})',
                };
            case 'hh':
            case 'HH':
                return {
                    group: 'hour',
                    pattern: '(\\d{2})',
                };
            case 'm':
                return {
                    group: 'minute',
                    pattern: '(\\d{1,2})',
                };
            case 'mm':
                return {
                    group: 'minute',
                    pattern: '(\\d{2})',
                };
            case 's':
                return {
                    group: 'second',
                    pattern: '(\\d{1,2})',
                };
            case 'ss':
                return {
                    group: 'second',
                    pattern: '(\\d{2})',
                };
            case 'a':
            case 'A':
                return {
                    group: 'ampm',
                    pattern: '(AM|PM|am|pm)',
                };
        }
    }
    lang;
    constructor(date = null, format = 'YYYY-MM-DD', lang = 'en-US') {
        super(DateTime.parseDateTime(date, format, lang));
        this.lang = lang;
    }
    /**
     * Returns the week number
     *
     * @param firstDay
     * @returns Number
     */
    getWeek(firstDay) {
        const target = new Date(this.midnight_ts(this));
        const dayNr = (this.getDay() + (7 - firstDay)) % 7;
        target.setDate(target.getDate() - dayNr);
        const startWeekday = target.getTime();
        target.setMonth(0, 1);
        if (target.getDay() !== firstDay) {
            target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
        }
        return 1 + Math.ceil((startWeekday - target.getTime()) / 604800000);
    }
    /**
     * Duplicate the date
     *
     * @returns DateTime
     */
    clone() {
        return new DateTime(this);
    }
    /**
     * Convert DateTime to Date object
     *
     * @returns Date
     */
    toJSDate() {
        return new Date(this);
    }
    /**
     * Find DateTime object (this) in passed DateTime array
     *
     * @param array
     * @param inclusivity
     * @returns Boolean
     */
    inArray(array, inclusivity = '[]') {
        return array.some((d) => {
            if (d instanceof Array) {
                return this.isBetween(d[0], d[1], inclusivity);
            }
            return this.isSame(d, 'day');
        });
    }
    /**
     * Check if a DateTime is between two other DateTime, optionally looking at unit scale
     *
     * @param date1
     * @param date2
     * @param inclusivity
     * @returns Boolean
     */
    isBetween(date1, date2, inclusivity = '()') {
        switch (inclusivity) {
            default:
            case '()':
                return this.midnight_ts(this) > this.midnight_ts(date1)
                    && this.midnight_ts(this) < this.midnight_ts(date2);
            case '[)':
                return this.midnight_ts(this) >= this.midnight_ts(date1)
                    && this.midnight_ts(this) < this.midnight_ts(date2);
            case '(]':
                return this.midnight_ts(this) > this.midnight_ts(date1)
                    && this.midnight_ts(this) <= this.midnight_ts(date2);
            case '[]':
                return this.midnight_ts() >= this.midnight_ts(date1)
                    && this.midnight_ts() <= this.midnight_ts(date2);
        }
    }
    /**
     * Check if a DateTime is before another DateTime.
     *
     * @param date
     * @param unit
     * @returns Boolean
     */
    isBefore(date, unit = 'days') {
        switch (unit) {
            case 'day':
            case 'days':
                return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
                    > new Date(this.getFullYear(), this.getMonth(), this.getDate()).getTime();
            case 'month':
            case 'months':
                return new Date(date.getFullYear(), date.getMonth(), 1).getTime()
                    > new Date(this.getFullYear(), this.getMonth(), 1).getTime();
            case 'year':
            case 'years':
                return date.getFullYear() > this.getFullYear();
        }
        throw new Error('isBefore: Invalid unit!');
    }
    /**
     * Check if a DateTime is before or the same as another DateTime.
     *
     * @param date
     * @param unit
     * @returns Boolean
     */
    isSameOrBefore(date, unit = 'days') {
        switch (unit) {
            case 'day':
            case 'days':
                return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
                    >= new Date(this.getFullYear(), this.getMonth(), this.getDate()).getTime();
            case 'month':
            case 'months':
                return new Date(date.getFullYear(), date.getMonth(), 1).getTime()
                    >= new Date(this.getFullYear(), this.getMonth(), 1).getTime();
        }
        throw new Error('isSameOrBefore: Invalid unit!');
    }
    /**
     * Check if a DateTime is after another DateTime.
     *
     * @param date
     * @param unit
     * @returns Boolean
     */
    isAfter(date, unit = 'days') {
        switch (unit) {
            case 'day':
            case 'days':
                return new Date(this.getFullYear(), this.getMonth(), this.getDate()).getTime()
                    > new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
            case 'month':
            case 'months':
                return new Date(this.getFullYear(), this.getMonth(), 1).getTime()
                    > new Date(date.getFullYear(), date.getMonth(), 1).getTime();
            case 'year':
            case 'years':
                return this.getFullYear() > date.getFullYear();
        }
        throw new Error('isAfter: Invalid unit!');
    }
    /**
     * Check if a DateTime is after or the same as another DateTime.
     *
     * @param date
     * @param unit
     * @returns Boolean
     */
    isSameOrAfter(date, unit = 'days') {
        switch (unit) {
            case 'day':
            case 'days':
                return new Date(this.getFullYear(), this.getMonth(), this.getDate()).getTime()
                    >= new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
            case 'month':
            case 'months':
                return new Date(this.getFullYear(), this.getMonth(), 1).getTime()
                    >= new Date(date.getFullYear(), date.getMonth(), 1).getTime();
        }
        throw new Error('isSameOrAfter: Invalid unit!');
    }
    /**
     * Check if a DateTime is the same as another DateTime.
     *
     * @param date
     * @param unit
     * @returns Boolean
     */
    isSame(date, unit = 'days') {
        switch (unit) {
            case 'day':
            case 'days':
                return new Date(this.getFullYear(), this.getMonth(), this.getDate()).getTime()
                    === new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
            case 'month':
            case 'months':
                return new Date(this.getFullYear(), this.getMonth(), 1).getTime()
                    === new Date(date.getFullYear(), date.getMonth(), 1).getTime();
        }
        throw new Error('isSame: Invalid unit!');
    }
    /**
     * Mutates the original DateTime by adding time.
     *
     * @param duration
     * @param unit
     */
    add(duration, unit = 'days') {
        switch (unit) {
            case 'day':
            case 'days':
                this.setDate(this.getDate() + duration);
                break;
            case 'month':
            case 'months':
                this.setMonth(this.getMonth() + duration);
                break;
        }
        return this;
    }
    /**
     * Mutates the original DateTime by subtracting time.
     *
     * @param duration
     * @param unit
     */
    subtract(duration, unit = 'days') {
        switch (unit) {
            case 'day':
            case 'days':
                this.setDate(this.getDate() - duration);
                break;
            case 'month':
            case 'months':
                this.setMonth(this.getMonth() - duration);
                break;
        }
        return this;
    }
    /**
     * Returns diff between two DateTime
     *
     * @param date
     * @param unit
     * @returns Number
     */
    diff(date, unit = 'days') {
        const oneDay = 1000 * 60 * 60 * 24;
        switch (unit) {
            default:
            case 'day':
            case 'days':
                return Math.round((this.midnight_ts() - this.midnight_ts(date)) / oneDay);
            case 'month':
            case 'months':
                // eslint-disable-next-line no-case-declarations
                let months = (date.getFullYear() - this.getFullYear()) * 12;
                months -= date.getMonth();
                months += this.getMonth();
                return months;
        }
    }
    /**
     * Format output
     *
     * @param format
     * @param lang
     * @returns String
     */
    format(format, lang = 'en-US') {
        let response = '';
        const matches = [];
        let m = null;
        while ((m = DateTime.regex.exec(format)) != null) {
            if (m[1] === '\\')
                continue; // delete when regexp lookbehind
            matches.push(m);
        }
        if (matches.length) {
            // add start line of tokens are not at the beginning
            if (matches[0].index > 0) {
                response += format.substring(0, matches[0].index);
            }
            for (const [k, match] of Object.entries(matches)) {
                const key = Number(k);
                response += this.formatTokens(match[0], lang);
                if (matches[key + 1]) {
                    response += format.substring(match.index + match[0].length, matches[key + 1].index);
                }
                // add end line if tokens are not at the ending
                if (key === matches.length - 1) {
                    response += format.substring(match.index + match[0].length);
                }
            }
        }
        // remove escape characters
        return response.replace(/\\/g, '');
    }
    /**
     * Returns the midnight timestamp of a date
     *
     * @param date
     * @returns Date
     */
    midnight_ts(date) {
        if (date) {
            return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime();
        }
        return new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0, 0).getTime();
    }
    /**
     * Returns the formatted string of the passed token
     *
     * @param token
     * @param lang
     * @returns String
     */
    formatTokens(token, lang) {
        switch (token) {
            case 'YY': return String(this.getFullYear()).slice(-2);
            case 'YYYY': return String(this.getFullYear());
            case 'M': return String(this.getMonth() + 1);
            case 'MM': return `0${this.getMonth() + 1}`.slice(-2);
            case 'MMM': return DateTime.shortMonths(lang)[this.getMonth()];
            case 'MMMM': return DateTime.longMonths(lang)[this.getMonth()];
            case 'D': return String(this.getDate());
            case 'DD': return `0${this.getDate()}`.slice(-2);
            case 'H': return String(this.getHours());
            case 'HH': return `0${this.getHours()}`.slice(-2);
            case 'h': return String(this.getHours() % 12 || 12);
            case 'hh':
                // eslint-disable-next-line no-case-declarations
                const h = this.getHours() % 12 || 12;
                return `0${h}`.slice(-2);
            case 'm': return String(this.getMinutes());
            case 'mm': return `0${this.getMinutes()}`.slice(-2);
            case 's': return String(this.getSeconds());
            case 'ss': return `0${this.getSeconds()}`.slice(-2);
            case 'a': return (this.getHours() < 12 || this.getHours() === 24) ? 'am' : 'pm';
            case 'A': return (this.getHours() < 12 || this.getHours() === 24) ? 'AM' : 'PM';
            default: return '';
        }
    }
}

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

class BasePlugin {
    picker;
    options;
    priority = 0;
    dependencies = [];
    /**
     * - Called automatically via PluginManager.initialize() or PluginManager.addInstance() -
     * Add plugin to the picker
     *
     * @param picker
     */
    attach(picker) {
        const pluginName = this['getName']();
        const optionsOriginal = { ...this.options };
        this.options = {
            ...this.options,
            ...(picker.options[pluginName] || {}),
        };
        // copy deep object options
        for (const objName of Object.keys(optionsOriginal)) {
            if (optionsOriginal[objName] !== null
                && typeof optionsOriginal[objName] === 'object'
                && Object.keys(optionsOriginal[objName]).length
                && pluginName in picker.options
                && objName in picker.options[pluginName]) {
                const optionValue = { ...picker.options[pluginName][objName] };
                if (optionValue !== null
                    && typeof optionValue === 'object'
                    && Object.keys(optionValue).length
                    && Object.keys(optionValue).every(opt => Object.keys(optionsOriginal[objName]).includes(opt))) {
                    this.options[objName] = { ...optionsOriginal[objName], ...optionValue };
                }
            }
        }
        this.picker = picker;
        if (this.dependenciesNotFound()) {
            const deps = this.dependencies.filter(x => !this.pluginsAsStringArray().includes(x));
            console.warn(`${this['getName']()}: required dependencies (${deps.join(', ')}).`);
            return;
        }
        const pluginClass = this.camelCaseToKebab(this['getName']());
        this.picker.ui.container.classList.add(pluginClass);
        this['onAttach']();
    }
    /**
     * - Called automatically via PluginManager.removeInstance() -
     * Remove plugin from the picker
     */
    detach() {
        const pluginClass = this.camelCaseToKebab(this['getName']());
        this.picker.ui.container.classList.remove(pluginClass);
        if (typeof this['onDetach'] === 'function') {
            this['onDetach']();
        }
    }
    /**
     * Check dependencies for plugin
     *
     * @returns Boolean
     */
    dependenciesNotFound() {
        return this.dependencies.length
            && !this.dependencies.every(v => this.pluginsAsStringArray().includes(v));
    }
    /**
     * Return plugins list as string array
     *
     * @returns []
     */
    pluginsAsStringArray() {
        return this.picker.options.plugins
            .map(x => typeof x === 'function' ? (new x).getName() : x);
    }
    /**
     * Return camelCase in kebab-case
     * Eg.: `userName` -> `user-name`
     *
     * @param str
     * @returns String
     */
    camelCaseToKebab(str) {
        return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
    }
}

class LockPlugin extends BasePlugin {
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
            this.options.minDate = new DateTime(this.options.minDate, this.picker.options.format, this.picker.options.lang);
        }
        if (this.options.maxDate) {
            this.options.maxDate = new DateTime(this.options.maxDate, this.picker.options.format, this.picker.options.lang);
            if (this.options.maxDate instanceof DateTime
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
            if (this.options.minDate instanceof DateTime) {
                if (date.isSameOrBefore(this.options.minDate, 'month')) {
                    target.classList.add('no-previous-month');
                }
            }
            if (this.options.maxDate instanceof DateTime) {
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
            const startDate = new DateTime(Number(target.dataset.start));
            const endDate = new DateTime(Number(target.dataset.end));
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
        return this.options.minDate instanceof DateTime
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
        return this.options.maxDate instanceof DateTime
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

class PresetPlugin extends BasePlugin {
    dependencies = ['RangePlugin'];
    binds = {
        onView: this.onView.bind(this),
        onClick: this.onClick.bind(this),
    };
    options = {
        customLabels: ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Last Month'],
        customPreset: {},
        position: 'left',
    };
    /**
     * Returns plugin name
     *
     * @returns String
     */
    getName() {
        return 'PresetPlugin';
    }
    /**
     * - Called automatically via BasePlugin.attach() -
     * The function execute on initialize the picker
     */
    onAttach() {
        if (!Object.keys(this.options.customPreset).length) {
            const date = new DateTime();
            const thisMonth = () => {
                const d1 = date.clone();
                d1.setDate(1);
                const d2 = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                return [new DateTime(d1), new DateTime(d2)];
            };
            const lastMonth = () => {
                const d1 = date.clone();
                d1.setMonth(d1.getMonth() - 1);
                d1.setDate(1);
                const d2 = new Date(date.getFullYear(), date.getMonth(), 0);
                return [new DateTime(d1), new DateTime(d2)];
            };
            const ranges = [
                [date.clone(), date.clone()],
                [date.clone().subtract(1, 'day'), date.clone().subtract(1, 'day')],
                [date.clone().subtract(6, 'day'), date.clone()],
                [date.clone().subtract(29, 'day'), date.clone()],
                thisMonth(),
                lastMonth(),
            ];
            Object.values(this.options.customLabels).forEach((label, key) => {
                this.options.customPreset[label] = ranges[key];
            });
        }
        this.picker.on('view', this.binds.onView);
        this.picker.on('click', this.binds.onClick);
    }
    /**
     * - Called automatically via BasePlugin.detach() -
     */
    onDetach() {
        this.picker.off('view', this.binds.onView);
        this.picker.off('click', this.binds.onClick);
    }
    /**
     * Function `view` event
     * Adds HTML layout of current plugin to the picker layout
     *
     * @param event
     */
    onView(event) {
        const { view, target } = event.detail;
        if (view === 'Main') {
            const container = document.createElement('div');
            container.className = 'preset-plugin-container';
            Object.keys(this.options.customPreset).forEach((itemKey) => {
                if (Object.prototype.hasOwnProperty.call(this.options.customPreset, itemKey)) {
                    const values = this.options.customPreset[itemKey];
                    const item = document.createElement('button');
                    item.className = 'preset-button unit';
                    item.innerHTML = itemKey;
                    item.dataset.start = values[0].getTime();
                    item.dataset.end = values[1].getTime();
                    container.appendChild(item);
                    this.picker.trigger('view', { view: 'PresetPluginButton', target: item });
                }
            });
            target.appendChild(container);
            target.classList.add(`preset-${this.options.position}`);
            this.picker.trigger('view', { view: 'PresetPluginContainer', target: container });
        }
    }
    /**
     * Handle click event
     *
     * @param event
     */
    onClick(event) {
        const target = event.target;
        if (target instanceof HTMLElement) {
            const element = target.closest('.unit');
            if (!(element instanceof HTMLElement))
                return;
            if (this.isPresetButton(element)) {
                const startDate = new DateTime(Number(element.dataset.start));
                const endDate = new DateTime(Number(element.dataset.end));
                if (this.picker.options.autoApply) {
                    this.picker.setDateRange(startDate, endDate);
                    this.picker.trigger('select', {
                        start: this.picker.getStartDate(),
                        end: this.picker.getEndDate(),
                    });
                    this.picker.hide();
                }
                else {
                    this.picker.datePicked = [
                        startDate,
                        endDate,
                    ];
                    this.picker.renderAll();
                }
            }
        }
    }
    /**
     * Determines if HTMLElement is preset buttons
     *
     * @param element
     * @returns Boolean
     */
    isPresetButton(element) {
        return element.classList.contains('preset-button');
    }
}

class RangePlugin extends BasePlugin {
    tooltipElement;
    triggerElement;
    binds = {
        setStartDate: this.setStartDate.bind(this),
        setEndDate: this.setEndDate.bind(this),
        setDateRange: this.setDateRange.bind(this),
        getStartDate: this.getStartDate.bind(this),
        getEndDate: this.getEndDate.bind(this),
        onView: this.onView.bind(this),
        onShow: this.onShow.bind(this),
        onMouseEnter: this.onMouseEnter.bind(this),
        onMouseLeave: this.onMouseLeave.bind(this),
        onClickCalendarDay: this.onClickCalendarDay.bind(this),
        onClickApplyButton: this.onClickApplyButton.bind(this),
        parseValues: this.parseValues.bind(this),
        updateValues: this.updateValues.bind(this),
        clear: this.clear.bind(this),
    };
    options = {
        elementEnd: null,
        startDate: null,
        endDate: null,
        repick: false,
        strict: true,
        delimiter: ' - ',
        tooltip: true,
        tooltipNumber: (num) => {
            return num;
        },
        locale: {
            zero: '',
            one: 'day',
            two: '',
            few: '',
            many: '',
            other: 'days',
        },
        documentClick: this.hidePicker.bind(this),
    };
    /**
     * Returns plugin name
     *
     * @returns String
     */
    getName() {
        return 'RangePlugin';
    }
    /**
     * - Called automatically via BasePlugin.attach() -
     * The function execute on initialize the picker
     */
    onAttach() {
        this.binds['_setStartDate'] = this.picker.setStartDate;
        this.binds['_setEndDate'] = this.picker.setEndDate;
        this.binds['_setDateRange'] = this.picker.setDateRange;
        this.binds['_getStartDate'] = this.picker.getStartDate;
        this.binds['_getEndDate'] = this.picker.getEndDate;
        this.binds['_parseValues'] = this.picker.parseValues;
        this.binds['_updateValues'] = this.picker.updateValues;
        this.binds['_clear'] = this.picker.clear;
        this.binds['_onClickCalendarDay'] = this.picker.onClickCalendarDay;
        this.binds['_onClickApplyButton'] = this.picker.onClickApplyButton;
        Object.defineProperties(this.picker, {
            setStartDate: {
                configurable: true,
                value: this.binds.setStartDate,
            },
            setEndDate: {
                configurable: true,
                value: this.binds.setEndDate,
            },
            setDateRange: {
                configurable: true,
                value: this.binds.setDateRange,
            },
            getStartDate: {
                configurable: true,
                value: this.binds.getStartDate,
            },
            getEndDate: {
                configurable: true,
                value: this.binds.getEndDate,
            },
            parseValues: {
                configurable: true,
                value: this.binds.parseValues,
            },
            updateValues: {
                configurable: true,
                value: this.binds.updateValues,
            },
            clear: {
                configurable: true,
                value: this.binds.clear,
            },
            onClickCalendarDay: {
                configurable: true,
                value: this.binds.onClickCalendarDay,
            },
            onClickApplyButton: {
                configurable: true,
                value: this.binds.onClickApplyButton,
            }
        });
        if (this.options.elementEnd) {
            if (!(this.options.elementEnd instanceof HTMLElement)) {
                this.options.elementEnd = this.picker
                    .options
                    .doc.querySelector(this.options.elementEnd);
            }
            if (this.options.elementEnd instanceof HTMLInputElement) {
                this.options.elementEnd.readOnly = this.picker.options.readonly;
            }
            if (typeof this.picker.options.documentClick === 'function') {
                document.removeEventListener('click', this.picker.options.documentClick, true);
                if (typeof this.options.documentClick === 'function') {
                    document.addEventListener('click', this.options.documentClick, true);
                }
            }
            this.options.elementEnd.addEventListener('click', this.picker.show.bind(this.picker));
        }
        this.options.repick = this.options.repick && this.options.elementEnd instanceof HTMLElement;
        this.picker.options.date = null;
        this.picker.on('view', this.binds.onView);
        this.picker.on('show', this.binds.onShow);
        this.picker.on('mouseenter', this.binds.onMouseEnter, true);
        this.picker.on('mouseleave', this.binds.onMouseLeave, true);
        this.checkIntlPluralLocales();
    }
    /**
     * - Called automatically via BasePlugin.detach() -
     */
    onDetach() {
        Object.defineProperties(this.picker, {
            setStartDate: {
                configurable: true,
                value: this.binds['_setStartDate'],
            },
            setEndDate: {
                configurable: true,
                value: this.binds['_setEndDate'],
            },
            setDateRange: {
                configurable: true,
                value: this.binds['_setDateRange'],
            },
            getStartDate: {
                configurable: true,
                value: this.binds['_getStartDate'],
            },
            getEndDate: {
                configurable: true,
                value: this.binds['_getEndDate'],
            },
            parseValues: {
                configurable: true,
                value: this.binds['_parseValues'],
            },
            updateValues: {
                configurable: true,
                value: this.binds['_updateValues'],
            },
            clear: {
                configurable: true,
                value: this.binds['_clear'],
            },
            onClickCalendarDay: {
                configurable: true,
                value: this.binds['_onClickCalendarDay'],
            },
            onClickApplyButton: {
                configurable: true,
                value: this.binds['_onClickApplyButton'],
            }
        });
        this.picker.off('view', this.binds.onView);
        this.picker.off('show', this.binds.onShow);
        this.picker.off('mouseenter', this.binds.onMouseEnter, true);
        this.picker.off('mouseleave', this.binds.onMouseLeave, true);
    }
    /**
     * Parse `startDate`, `endDate` options or value of input elements
     */
    parseValues() {
        if (this.options.startDate || this.options.endDate) {
            if (this.options.strict) {
                if (this.options.startDate && this.options.endDate) {
                    this.setDateRange(this.options.startDate, this.options.endDate);
                }
                else {
                    this.options.startDate = null;
                    this.options.endDate = null;
                }
            }
            else {
                if (this.options.startDate) {
                    this.setStartDate(this.options.startDate);
                }
                if (this.options.endDate) {
                    this.setEndDate(this.options.endDate);
                }
            }
            return;
        }
        if (this.options.elementEnd) {
            if (this.options.strict) {
                if (this.picker.options.element instanceof HTMLInputElement
                    && this.picker.options.element.value.length
                    && this.options.elementEnd instanceof HTMLInputElement
                    && this.options.elementEnd.value.length) {
                    this.setDateRange(this.picker.options.element.value, this.options.elementEnd.value);
                }
            }
            else {
                if (this.picker.options.element instanceof HTMLInputElement
                    && this.picker.options.element.value.length) {
                    this.setStartDate(this.picker.options.element.value);
                }
                if (this.options.elementEnd instanceof HTMLInputElement
                    && this.options.elementEnd.value.length) {
                    this.setEndDate(this.options.elementEnd.value);
                }
            }
        }
        else if (this.picker.options.element instanceof HTMLInputElement && this.picker.options.element.value.length) {
            const [_start, _end] = this.picker.options.element.value.split(this.options.delimiter);
            if (this.options.strict) {
                if (_start && _end) {
                    this.setDateRange(_start, _end);
                }
            }
            else {
                if (_start)
                    this.setStartDate(_start);
                if (_end)
                    this.setEndDate(_end);
            }
        }
    }
    /**
     * Update value of input element
     */
    updateValues() {
        const el = this.picker.options.element;
        const elEnd = this.options.elementEnd;
        const start = this.picker.getStartDate();
        const end = this.picker.getEndDate();
        const startString = start instanceof Date
            ? start.format(this.picker.options.format, this.picker.options.lang)
            : '';
        const endString = end instanceof Date
            ? end.format(this.picker.options.format, this.picker.options.lang)
            : '';
        if (elEnd) {
            if (el instanceof HTMLInputElement) {
                el.value = startString;
            }
            else if (el instanceof HTMLElement) {
                el.innerText = startString;
            }
            if (elEnd instanceof HTMLInputElement) {
                elEnd.value = endString;
            }
            else if (elEnd instanceof HTMLElement) {
                elEnd.innerText = endString;
            }
        }
        else {
            const delimiter = startString || endString ? this.options.delimiter : '';
            const formatString = `${startString}${delimiter}${endString}`;
            if (el instanceof HTMLInputElement) {
                el.value = formatString;
            }
            else if (el instanceof HTMLElement) {
                el.innerText = formatString;
            }
        }
    }
    /**
     * Clear selection
     */
    clear() {
        this.options.startDate = null;
        this.options.endDate = null;
        this.picker.datePicked.length = 0;
        this.updateValues();
        this.picker.renderAll();
        this.picker.trigger('clear');
    }
    /**
     * Function `show` event
     *
     * @param event
     */
    onShow(event) {
        const { target } = event.detail;
        this.triggerElement = target;
        if (this.picker.options.scrollToDate && this.getStartDate() instanceof Date) {
            this.picker.gotoDate(this.getStartDate());
        }
        this.initializeRepick();
    }
    /**
     * Function `view` event
     * Adds HTML layout of current plugin to the picker layout
     *
     * @param event
     */
    onView(event) {
        const { view, target } = event.detail;
        if (view === 'Main') {
            this.tooltipElement = document.createElement('span');
            this.tooltipElement.className = 'range-plugin-tooltip';
            target.appendChild(this.tooltipElement);
        }
        if (view === 'CalendarDay') {
            const date = new DateTime(target.dataset.time);
            const datePicked = this.picker.datePicked;
            const start = datePicked.length ? this.picker.datePicked[0] : this.getStartDate();
            const end = datePicked.length ? this.picker.datePicked[1] : this.getEndDate();
            if (start && start.isSame(date, 'day')) {
                target.classList.add('start');
            }
            if (start && end) {
                if (end.isSame(date, 'day')) {
                    target.classList.add('end');
                }
                if (date.isBetween(start, end)) {
                    target.classList.add('in-range');
                }
            }
        }
        if (view === 'Footer') {
            const allowApplyBtn = (this.picker.datePicked.length === 1 && !this.options.strict)
                || this.picker.datePicked.length === 2;
            const applyButton = target.querySelector('.apply-button');
            applyButton.disabled = !allowApplyBtn;
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
        if (this.picker.isShown()
            && host !== this.picker.ui.wrapper
            && target !== this.picker.options.element
            && target !== this.options.elementEnd) {
            this.picker.hide();
        }
    }
    /**
     * Set startDate programmatically
     *
     * @param date
     */
    setStartDate(date) {
        const d = new DateTime(date, this.picker.options.format);
        this.options.startDate = d ? d.clone() : null;
        this.updateValues();
        this.picker.renderAll();
    }
    /**
     * Set endDate programmatically
     *
     * @param date
     */
    setEndDate(date) {
        const d = new DateTime(date, this.picker.options.format);
        this.options.endDate = d ? d.clone() : null;
        this.updateValues();
        this.picker.renderAll();
    }
    /**
     * Set date range programmatically
     *
     * @param start
     * @param end
     */
    setDateRange(start, end) {
        const startDate = new DateTime(start, this.picker.options.format);
        const endDate = new DateTime(end, this.picker.options.format);
        this.options.startDate = startDate ? startDate.clone() : null;
        this.options.endDate = endDate ? endDate.clone() : null;
        this.updateValues();
        this.picker.renderAll();
    }
    /**
     *
     * @returns DateTime
     */
    getStartDate() {
        return this.options.startDate instanceof Date ? this.options.startDate.clone() : null;
    }
    /**
     *
     * @returns
     */
    getEndDate() {
        return this.options.endDate instanceof Date ? this.options.endDate.clone() : null;
    }
    /**
     * Handle `mouseenter` event
     *
     * @param event
     */
    onMouseEnter(event) {
        const target = event.target;
        if (target instanceof HTMLElement) {
            if (this.isContainer(target)) {
                this.initializeRepick();
            }
            const element = target.closest('.unit');
            if (!(element instanceof HTMLElement))
                return;
            if (this.picker.isCalendarDay(element)) {
                if (this.picker.datePicked.length !== 1)
                    return;
                let date1 = this.picker.datePicked[0].clone();
                let date2 = new DateTime(element.dataset.time);
                let isFlipped = false;
                if (date1.isAfter(date2, 'day')) {
                    const tempDate = date1.clone();
                    date1 = date2.clone();
                    date2 = tempDate.clone();
                    isFlipped = true;
                }
                const days = [...this.picker.ui.container.querySelectorAll('.day')];
                days.forEach((d) => {
                    const date = new DateTime(d.dataset.time);
                    const dayView = this.picker.Calendar.getCalendarDayView(date);
                    if (date.isBetween(date1, date2)) {
                        dayView.classList.add('in-range');
                    }
                    if (date.isSame(this.picker.datePicked[0], 'day')) {
                        dayView.classList.add('start');
                        dayView.classList.toggle('flipped', isFlipped);
                    }
                    if (d === element) {
                        dayView.classList.add('end');
                        dayView.classList.toggle('flipped', isFlipped);
                    }
                    d.className = dayView.className;
                });
                if (this.options.tooltip) {
                    const diff = this.options.tooltipNumber(date2.diff(date1, 'day') + 1);
                    if (diff > 0) {
                        const pluralKey = new Intl.PluralRules(this.picker.options.lang).select(diff);
                        const text = `${diff} ${this.options.locale[pluralKey]}`;
                        this.showTooltip(element, text);
                    }
                    else {
                        this.hideTooltip();
                    }
                }
            }
        }
    }
    /**
     * Handle `mouseleave` event
     *
     * @param event
     */
    onMouseLeave(event) {
        if (this.isContainer(event.target) && this.options.repick) {
            const start = this.getStartDate();
            const end = this.getEndDate();
            if (start && end) {
                this.picker.datePicked.length = 0;
                this.picker.renderAll();
            }
        }
    }
    onClickCalendarDay(element) {
        if (this.picker.isCalendarDay(element)) {
            if (this.picker.datePicked.length === 2) {
                this.picker.datePicked.length = 0;
            }
            const date = new DateTime(element.dataset.time);
            this.picker.datePicked[this.picker.datePicked.length] = date;
            if (this.picker.datePicked.length === 2 && this.picker.datePicked[0].isAfter(this.picker.datePicked[1])) {
                const tempDate = this.picker.datePicked[1].clone();
                this.picker.datePicked[1] = this.picker.datePicked[0].clone();
                this.picker.datePicked[0] = tempDate.clone();
            }
            if (this.picker.datePicked.length === 1 || !this.picker.options.autoApply) {
                this.picker.trigger('preselect', {
                    start: this.picker.datePicked[0] instanceof Date ? this.picker.datePicked[0].clone() : null,
                    end: this.picker.datePicked[1] instanceof Date ? this.picker.datePicked[1].clone() : null,
                });
            }
            if (this.picker.datePicked.length === 1) {
                if (!this.options.strict && this.picker.options.autoApply) {
                    if (this.picker.options.element === this.triggerElement) {
                        this.setStartDate(this.picker.datePicked[0]);
                    }
                    if (this.options.elementEnd === this.triggerElement) {
                        this.setEndDate(this.picker.datePicked[0]);
                    }
                    this.picker.trigger('select', { start: this.picker.getStartDate(), end: this.picker.getEndDate() });
                }
                this.picker.renderAll();
            }
            if (this.picker.datePicked.length === 2) {
                if (this.picker.options.autoApply) {
                    this.setDateRange(this.picker.datePicked[0], this.picker.datePicked[1]);
                    this.picker.trigger('select', { start: this.picker.getStartDate(), end: this.picker.getEndDate() });
                    this.picker.hide();
                }
                else {
                    this.hideTooltip();
                    this.picker.renderAll();
                }
            }
        }
    }
    onClickApplyButton(element) {
        if (this.picker.isApplyButton(element)) {
            if (this.picker.datePicked.length === 1 && !this.options.strict) {
                if (this.picker.options.element === this.triggerElement) {
                    this.options.endDate = null;
                    this.setStartDate(this.picker.datePicked[0]);
                }
                if (this.options.elementEnd === this.triggerElement) {
                    this.options.startDate = null;
                    this.setEndDate(this.picker.datePicked[0]);
                }
            }
            if (this.picker.datePicked.length === 2) {
                this.setDateRange(this.picker.datePicked[0], this.picker.datePicked[1]);
            }
            this.picker.trigger('select', { start: this.picker.getStartDate(), end: this.picker.getEndDate() });
            this.picker.hide();
        }
    }
    /**
     * Displays tooltip of selected days
     *
     * @param element
     * @param text
     */
    showTooltip(element, text) {
        this.tooltipElement.style.visibility = 'visible';
        this.tooltipElement.innerHTML = text;
        const container = this.picker.ui.container.getBoundingClientRect();
        const tooltip = this.tooltipElement.getBoundingClientRect();
        const day = element.getBoundingClientRect();
        let top = day.top;
        let left = day.left;
        top -= container.top;
        left -= container.left;
        top -= tooltip.height;
        left -= tooltip.width / 2;
        left += day.width / 2;
        this.tooltipElement.style.top = `${top}px`;
        this.tooltipElement.style.left = `${left}px`;
    }
    /**
     * Hide tooltip
     */
    hideTooltip() {
        this.tooltipElement.style.visibility = 'hidden';
    }
    /**
     * Determines if the locale option contains all required plurals
     */
    checkIntlPluralLocales() {
        if (!this.options.tooltip)
            return;
        const rules = [...new Set([
                new Intl.PluralRules(this.picker.options.lang).select(0),
                new Intl.PluralRules(this.picker.options.lang).select(1),
                new Intl.PluralRules(this.picker.options.lang).select(2),
                new Intl.PluralRules(this.picker.options.lang).select(6),
                new Intl.PluralRules(this.picker.options.lang).select(18),
            ])];
        const locales = Object.keys(this.options.locale);
        if (!rules.every(x => locales.includes(x))) {
            console.warn(`${this.getName()}: provide locales (${rules.join(', ')}) for correct tooltip text.`);
        }
    }
    /**
     * Handle `repick` option
     */
    initializeRepick() {
        if (!this.options.repick)
            return;
        const start = this.getStartDate();
        const end = this.getEndDate();
        if (end && this.triggerElement === this.picker.options.element) {
            this.picker.datePicked[0] = end;
        }
        if (start && this.triggerElement === this.options.elementEnd) {
            this.picker.datePicked[0] = start;
        }
    }
    /**
     * Determines if the element is the picker container
     *
     * @param element
     * @returns Boolean
     */
    isContainer(element) {
        return element === this.picker.ui.container;
    }
}

class TimePlugin extends BasePlugin {
    options = {
        native: false,
        seconds: false,
        stepHours: 1,
        stepMinutes: 5,
        stepSeconds: 5,
        format12: false,
    };
    rangePlugin;
    timePicked = {
        input: null,
        start: null,
        end: null,
    };
    timePrePicked = {
        input: null,
        start: null,
        end: null,
    };
    binds = {
        getDate: this.getDate.bind(this),
        getStartDate: this.getStartDate.bind(this),
        getEndDate: this.getEndDate.bind(this),
        onView: this.onView.bind(this),
        onInput: this.onInput.bind(this),
        onChange: this.onChange.bind(this),
        onClick: this.onClick.bind(this),
        setTime: this.setTime.bind(this),
        setStartTime: this.setStartTime.bind(this),
        setEndTime: this.setEndTime.bind(this),
    };
    /**
     * Returns plugin name
     *
     * @returns String
     */
    getName() {
        return 'TimePlugin';
    }
    /**
     * - Called automatically via BasePlugin.attach() -
     * The function execute on initialize the picker
     */
    onAttach() {
        this.binds['_getDate'] = this.picker.getDate;
        this.binds['_getStartDate'] = this.picker.getStartDate;
        this.binds['_getEndDate'] = this.picker.getEndDate;
        Object.defineProperties(this.picker, {
            getDate: {
                configurable: true,
                value: this.binds.getDate,
            },
            getStartDate: {
                configurable: true,
                value: this.binds.getStartDate,
            },
            getEndDate: {
                configurable: true,
                value: this.binds.getEndDate,
            },
            setTime: {
                configurable: true,
                value: this.binds.setTime,
            },
            setStartTime: {
                configurable: true,
                value: this.binds.setStartTime,
            },
            setEndTime: {
                configurable: true,
                value: this.binds.setEndTime,
            },
        });
        this.rangePlugin = this.picker.PluginManager.getInstance('RangePlugin');
        this.parseValues();
        this.picker.on('view', this.binds.onView);
        this.picker.on('input', this.binds.onInput);
        this.picker.on('change', this.binds.onChange);
        this.picker.on('click', this.binds.onClick);
    }
    /**
     * - Called automatically via BasePlugin.detach() -
     */
    onDetach() {
        delete this.picker.setTime;
        delete this.picker.setStartTime;
        delete this.picker.setEndTime;
        Object.defineProperties(this.picker, {
            getDate: {
                configurable: true,
                value: this.binds['_getDate']
            },
            getStartDate: {
                configurable: true,
                value: this.binds['_getStartDate']
            },
            getEndDate: {
                configurable: true,
                value: this.binds['_getEndDate']
            },
        });
        this.picker.off('view', this.binds.onView);
        this.picker.off('input', this.binds.onInput);
        this.picker.off('change', this.binds.onChange);
        this.picker.off('click', this.binds.onClick);
    }
    /**
     * Function `view` event
     * Adds HTML layout of current plugin to the picker layout
     *
     * @param event
     */
    onView(event) {
        const { view, target } = event.detail;
        if (view === 'Main') {
            this.rangePlugin = this.picker.PluginManager.getInstance('RangePlugin');
            const container = document.createElement('div');
            container.className = 'time-plugin-container';
            if (this.rangePlugin) {
                const startInput = this.getStartInput();
                container.appendChild(startInput);
                this.picker.trigger('view', { view: 'TimePluginInput', target: startInput });
                const endInput = this.getEndInput();
                container.appendChild(endInput);
                this.picker.trigger('view', { view: 'TimePluginInput', target: endInput });
            }
            else {
                const singleInput = this.getSingleInput();
                container.appendChild(singleInput);
                this.picker.trigger('view', { view: 'TimePluginInput', target: singleInput });
            }
            target.appendChild(container);
            this.picker.trigger('view', { view: 'TimePluginContainer', target: container });
        }
    }
    /**
     *
     * @param event
     */
    onInput(event) {
        const target = event.target;
        if (target instanceof HTMLInputElement && target.classList.contains('time-plugin-input')) {
            const date = this.timePicked[target.name] || new DateTime();
            const [hours, minutes] = target.value.split(':');
            date.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
            if (this.picker.options.autoApply) {
                this.timePicked[target.name] = date;
                this.picker.updateValues();
            }
            else {
                this.timePrePicked[target.name] = date;
            }
        }
    }
    /**
     * Handle `change` event
     *
     * @param event
     */
    onChange(event) {
        const target = event.target;
        if (target instanceof HTMLSelectElement && target.classList.contains('time-plugin-custom-input')) {
            const r = /(\w+)\[(\w+)\]/;
            const [, name, format] = target.name.match(r);
            const value = Number(target.value);
            let date = new DateTime();
            if (!this.picker.options.autoApply && this.timePrePicked[name] instanceof Date) {
                date = this.timePrePicked[name].clone();
            }
            else if (this.timePicked[name] instanceof Date) {
                date = this.timePicked[name].clone();
            }
            switch (format) {
                case 'HH':
                    if (this.options.format12) {
                        const period = target.closest('.time-plugin-custom-block')
                            .querySelector(`select[name="${name}[period]"]`).value;
                        const d = this.handleFormat12(period, date, value);
                        date.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), 0);
                    }
                    else {
                        date.setHours(value, date.getMinutes(), date.getSeconds(), 0);
                    }
                    break;
                case 'mm':
                    date.setHours(date.getHours(), value, date.getSeconds(), 0);
                    break;
                case 'ss':
                    date.setHours(date.getHours(), date.getMinutes(), value, 0);
                    break;
                case 'period':
                    if (this.options.format12) {
                        const hours = target.closest('.time-plugin-custom-block')
                            .querySelector(`select[name="${name}[HH]"]`).value;
                        const d = this.handleFormat12(target.value, date, Number(hours));
                        date.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), 0);
                    }
                    break;
            }
            if (this.picker.options.autoApply) {
                this.timePicked[name] = date;
                this.picker.updateValues();
            }
            else {
                this.timePrePicked[name] = date;
                const applyButton = this.picker.ui.container.querySelector('.apply-button');
                if (this.rangePlugin) {
                    const options = this.rangePlugin.options;
                    const datePicked = this.picker.datePicked;
                    const bool = (options.strict && datePicked.length === 2)
                        || (!options.strict && datePicked.length > 0)
                        || (!datePicked.length && options.strict && options.startDate instanceof Date && options.endDate instanceof Date)
                        || (!datePicked.length && !options.strict && (options.startDate instanceof Date || options.endDate instanceof Date));
                    applyButton.disabled = !bool;
                }
                else {
                    if (this.picker.datePicked.length) {
                        applyButton.disabled = false;
                    }
                }
            }
        }
    }
    onClick(event) {
        const target = event.target;
        if (target instanceof HTMLElement) {
            const element = target.closest('.unit');
            if (!(element instanceof HTMLElement))
                return;
            if (this.picker.isApplyButton(element)) {
                Object.keys(this.timePicked).forEach(x => {
                    if (this.timePrePicked[x] instanceof Date) {
                        this.timePicked[x] = this.timePrePicked[x].clone();
                    }
                });
                this.picker.updateValues();
                this.timePrePicked = {
                    input: null,
                    start: null,
                    end: null,
                };
            }
            if (this.picker.isCancelButton(element)) {
                this.timePrePicked = {
                    input: null,
                    start: null,
                    end: null,
                };
                this.picker.renderAll();
            }
        }
    }
    /**
     * Set time programmatically
     *
     * @param value
     * @param keyName
     */
    setTime(value) {
        const d = this.handleTimeString(value);
        this.timePicked.input = d.clone();
        this.picker.renderAll();
        this.picker.updateValues();
    }
    /**
     * Set start time programmatically
     *
     * @param value
     * @param keyName
     */
    setStartTime(value) {
        const d = this.handleTimeString(value);
        this.timePicked.start = d.clone();
        this.picker.renderAll();
        this.picker.updateValues();
    }
    /**
     * Set end time programmatically
     *
     * @param value
     * @param keyName
     */
    setEndTime(value) {
        const d = this.handleTimeString(value);
        this.timePicked.end = d.clone();
        this.picker.renderAll();
        this.picker.updateValues();
    }
    handleTimeString(value) {
        const d = new DateTime();
        const [h, m, s] = value.split(':').map(x => Number(x));
        const hours = h && !Number.isNaN(h) ? h : 0;
        const minutes = m && !Number.isNaN(m) ? m : 0;
        const seconds = s && !Number.isNaN(s) ? s : 0;
        d.setHours(hours, minutes, seconds, 0);
        return d;
    }
    /**
     * Adds time to DateTime object
     * Replaces the original `getDate` function
     *
     * @returns DateTime
     */
    getDate() {
        if (this.picker.options.date instanceof Date) {
            const date = new DateTime(this.picker.options.date, this.picker.options.format);
            if (this.timePicked.input instanceof Date) {
                const t = this.timePicked.input;
                date.setHours(t.getHours(), t.getMinutes(), t.getSeconds(), 0);
            }
            return date;
        }
        return null;
    }
    /**
     * Adds time to DateTime object
     * Replaces the original `getStartDate` function
     *
     * @returns DateTime
     */
    getStartDate() {
        if (this.rangePlugin.options.startDate instanceof Date) {
            const date = new DateTime(this.rangePlugin.options.startDate, this.picker.options.format);
            if (this.timePicked.start instanceof Date) {
                const t = this.timePicked.start;
                date.setHours(t.getHours(), t.getMinutes(), t.getSeconds(), 0);
            }
            return date;
        }
        return null;
    }
    /**
     * Adds time to DateTime object
     * Replaces the original `getEndDate` function
     *
     * @returns DateTime
     */
    getEndDate() {
        if (this.rangePlugin.options.endDate instanceof Date) {
            const date = new DateTime(this.rangePlugin.options.endDate, this.picker.options.format);
            if (this.timePicked.end instanceof Date) {
                const t = this.timePicked.end;
                date.setHours(t.getHours(), t.getMinutes(), t.getSeconds(), 0);
            }
            return date;
        }
        return null;
    }
    /**
     *
     * @returns HTMLElement
     */
    getSingleInput() {
        if (this.options.native) {
            return this.getNativeInput('input');
        }
        return this.getCustomInput('input');
    }
    /**
     *
     * @returns HTMLElement
     */
    getStartInput() {
        if (this.options.native) {
            return this.getNativeInput('start');
        }
        return this.getCustomInput('start');
    }
    /**
     *
     * @returns HTMLElement
     */
    getEndInput() {
        if (this.options.native) {
            return this.getNativeInput('end');
        }
        return this.getCustomInput('end');
    }
    /**
     * Returns `input[type="time"]` element
     *
     * @param name
     * @returns HTMLElement
     */
    getNativeInput(name) {
        const element = document.createElement('input');
        element.type = 'time';
        element.name = name;
        element.className = 'time-plugin-input unit';
        const t = this.timePicked[name];
        if (t) {
            const HH = `0${t.getHours()}`.slice(-2);
            const mm = `0${t.getMinutes()}`.slice(-2);
            element.value = `${HH}:${mm}`;
        }
        return element;
    }
    /**
     * Returns `select` element
     *
     * @param name
     * @returns HTMLElement
     */
    getCustomInput(name) {
        const block = document.createElement('div');
        block.className = 'time-plugin-custom-block';
        const hSelect = document.createElement('select');
        hSelect.className = 'time-plugin-custom-input unit';
        hSelect.name = `${name}[HH]`;
        const hStart = this.options.format12 ? 1 : 0;
        const hLimit = this.options.format12 ? 13 : 24;
        let date = null;
        if (!this.picker.options.autoApply && this.timePrePicked[name] instanceof Date) {
            date = this.timePrePicked[name].clone();
        }
        else if (this.timePicked[name] instanceof Date) {
            date = this.timePicked[name].clone();
        }
        for (let i = hStart; i < hLimit; i += this.options.stepHours) {
            const hOption = document.createElement('option');
            hOption.value = String(i);
            hOption.text = String(i);
            if (date) {
                if (this.options.format12) {
                    const hours = date.getHours() % 12 ? date.getHours() % 12 : 12;
                    if (hours === i) {
                        hOption.selected = true;
                    }
                }
                else if (date.getHours() === i) {
                    hOption.selected = true;
                }
            }
            hSelect.appendChild(hOption);
        }
        block.appendChild(hSelect);
        const mSelect = document.createElement('select');
        mSelect.className = 'time-plugin-custom-input unit';
        mSelect.name = `${name}[mm]`;
        const mLimit = 60;
        for (let i = 0; i < mLimit; i += this.options.stepMinutes) {
            const mOption = document.createElement('option');
            mOption.value = `0${String(i)}`.slice(-2);
            mOption.text = `0${String(i)}`.slice(-2);
            if (date && date.getMinutes() === i) {
                mOption.selected = true;
            }
            mSelect.appendChild(mOption);
        }
        block.appendChild(mSelect);
        if (this.options.seconds) {
            const sSelect = document.createElement('select');
            sSelect.className = 'time-plugin-custom-input unit';
            sSelect.name = `${name}[ss]`;
            const sLimit = 60;
            for (let i = 0; i < sLimit; i += this.options.stepSeconds) {
                const sOption = document.createElement('option');
                sOption.value = `0${String(i)}`.slice(-2);
                sOption.text = `0${String(i)}`.slice(-2);
                if (date && date.getSeconds() === i) {
                    sOption.selected = true;
                }
                sSelect.appendChild(sOption);
            }
            block.appendChild(sSelect);
        }
        if (this.options.format12) {
            const pSelect = document.createElement('select');
            pSelect.className = 'time-plugin-custom-input unit';
            pSelect.name = `${name}[period]`;
            ['AM', 'PM'].forEach(x => {
                const pOption = document.createElement('option');
                pOption.value = x;
                pOption.text = x;
                if (date && x === 'PM' && date.getHours() >= 12) {
                    pOption.selected = true;
                }
                pSelect.appendChild(pOption);
            });
            block.appendChild(pSelect);
        }
        return block;
    }
    /**
     * Handle 12H time
     *
     * @param period
     * @param date
     * @param value
     * @returns DateTime
     */
    handleFormat12(period, date, value) {
        const d = date.clone();
        switch (period) {
            case 'AM':
                if (value === 12) {
                    d.setHours(0, d.getMinutes(), d.getSeconds(), 0);
                }
                else {
                    d.setHours(value, d.getMinutes(), d.getSeconds(), 0);
                }
                break;
            case 'PM':
                if (value !== 12) {
                    d.setHours(value + 12, d.getMinutes(), d.getSeconds(), 0);
                }
                else {
                    d.setHours(value, d.getMinutes(), d.getSeconds(), 0);
                }
                break;
        }
        return d;
    }
    parseValues() {
        if (this.rangePlugin) {
            if (this.rangePlugin.options.strict) {
                if (this.rangePlugin.options.startDate && this.rangePlugin.options.endDate) {
                    const d1 = new DateTime(this.rangePlugin.options.startDate, this.picker.options.format);
                    const d2 = new DateTime(this.rangePlugin.options.endDate, this.picker.options.format);
                    this.timePicked.start = d1.clone();
                    this.timePicked.end = d2.clone();
                }
            }
            else {
                if (this.rangePlugin.options.startDate) {
                    const d = new DateTime(this.rangePlugin.options.startDate, this.picker.options.format);
                    this.timePicked.start = d.clone();
                }
                if (this.rangePlugin.options.endDate) {
                    const d = new DateTime(this.rangePlugin.options.endDate, this.picker.options.format);
                    this.timePicked.end = d.clone();
                }
            }
            if (this.rangePlugin.options.elementEnd) {
                if (this.rangePlugin.options.strict) {
                    if (this.picker.options.element instanceof HTMLInputElement
                        && this.picker.options.element.value.length
                        && this.rangePlugin.options.elementEnd instanceof HTMLInputElement
                        && this.rangePlugin.options.elementEnd.value.length) {
                        const d1 = new DateTime(this.picker.options.element.value, this.picker.options.format);
                        const d2 = new DateTime(this.rangePlugin.options.elementEnd.value, this.picker.options.format);
                        this.timePicked.start = d1.clone();
                        this.timePicked.end = d2.clone();
                    }
                }
                else {
                    if (this.picker.options.element instanceof HTMLInputElement
                        && this.picker.options.element.value.length) {
                        const d = new DateTime(this.picker.options.element.value, this.picker.options.format);
                        this.timePicked.start = d.clone();
                    }
                    if (this.rangePlugin.options.elementEnd instanceof HTMLInputElement
                        && this.rangePlugin.options.elementEnd.value.length) {
                        const d = new DateTime(this.rangePlugin.options.elementEnd.value, this.picker.options.format);
                        this.timePicked.start = d.clone();
                    }
                }
            }
            else if (this.picker.options.element instanceof HTMLInputElement && this.picker.options.element.value.length) {
                const [_start, _end] = this.picker.options.element.value.split(this.rangePlugin.options.delimiter);
                if (this.rangePlugin.options.strict) {
                    if (_start && _end) {
                        const d1 = new DateTime(_start, this.picker.options.format);
                        const d2 = new DateTime(_end, this.picker.options.format);
                        this.timePicked.start = d1.clone();
                        this.timePicked.end = d2.clone();
                    }
                }
                else {
                    if (_start) {
                        const d = new DateTime(_start, this.picker.options.format);
                        this.timePicked.start = d.clone();
                    }
                    if (_end) {
                        const d = new DateTime(_end, this.picker.options.format);
                        this.timePicked.start = d.clone();
                    }
                }
            }
        }
        else {
            if (this.picker.options.date) {
                const d = new DateTime(this.picker.options.date, this.picker.options.format);
                this.timePicked.input = d.clone();
            }
            if (this.picker.options.element instanceof HTMLInputElement && this.picker.options.element.value.length) {
                const d = new DateTime(this.picker.options.element.value, this.picker.options.format);
                this.timePicked.input = d.clone();
            }
        }
    }
}

class KbdPlugin extends BasePlugin {
    docElement = null;
    rangePlugin;
    binds = {
        onView: this.onView.bind(this),
        onKeydown: this.onKeydown.bind(this),
    };
    options = {
        unitIndex: 1,
        dayIndex: 2,
    };
    /**
     * Returns plugin name
     *
     * @returns String
     */
    getName() {
        return 'KbdPlugin';
    }
    /**
     * - Called automatically via BasePlugin.attach() -
     * The function execute on initialize the picker
     */
    onAttach() {
        const element = this.picker.options.element;
        const elementBounds = element.getBoundingClientRect();
        this.docElement = document.createElement('span');
        this.docElement.style.position = 'absolute';
        this.docElement.style.top = `${element.offsetTop}px`;
        this.docElement.style.left = `${(element.offsetLeft + elementBounds.width) - 25}px`; // 25px width of icon
        this.docElement.attachShadow({ mode: 'open' });
        if (this.options.html) {
            this.docElement.shadowRoot.innerHTML = this.options.html;
        }
        else {
            const style = window.getComputedStyle(this.picker.options.element);
            const html = `
      <style>
      button {
        border: none;
        background: transparent;
        font-size: ${style.fontSize};
      }
      </style>

      <button>&#128197;</button>
      `;
            this.docElement.shadowRoot.innerHTML = html;
        }
        const button = this.docElement.shadowRoot.querySelector('button');
        if (button) {
            button.addEventListener('click', (evt) => {
                evt.preventDefault();
                this.picker.show({ target: this.picker.options.element });
            }, { capture: true });
            button.addEventListener('keydown', (evt) => {
                if (evt.code === 'Escape') {
                    this.picker.hide();
                }
            }, { capture: true });
        }
        this.picker.options.element.after(this.docElement);
        this.picker.on('view', this.binds.onView);
        this.picker.on('keydown', this.binds.onKeydown);
    }
    /**
     * - Called automatically via BasePlugin.detach() -
     */
    onDetach() {
        if (this.docElement && this.docElement.isConnected) {
            this.docElement.remove();
        }
        this.picker.off('view', this.binds.onView);
        this.picker.off('keydown', this.binds.onKeydown);
    }
    /**
     * Function `view` event
     * Adds `tabIndex` to the picker elements
     *
     * @param event
     */
    onView(event) {
        const { view, target } = event.detail;
        if (target && 'querySelector' in target) {
            if (view === 'CalendarDay' && !['locked', 'not-available'].some(x => target.classList.contains(x))) {
                target.tabIndex = this.options.dayIndex;
            }
            else {
                const elems = target.querySelectorAll('.unit:not(.day)');
                [...elems].forEach((el) => el.tabIndex = this.options.unitIndex);
            }
        }
    }
    /**
     * Function for `keydown` event
     * Handle keys when the picker has focus
     *
     * @param event
     */
    onKeydown(event) {
        this.onMouseEnter(event);
        switch (event.code) {
            case 'ArrowUp':
            case 'ArrowDown':
                this.verticalMove(event);
                break;
            case 'ArrowLeft':
            case 'ArrowRight':
                this.horizontalMove(event);
                break;
            case 'Enter':
            case 'Space':
                this.handleEnter(event);
                break;
            case 'Escape':
                this.picker.hide();
                break;
        }
    }
    /**
     * Find closest day elements
     *
     * @param layout
     * @param target
     * @param isAllow
     * @returns Boolean
     */
    findAllowableDaySibling(layout, target, isAllow) {
        const elms = Array.from(layout.querySelectorAll(`.day[tabindex="${this.options.dayIndex}"]`));
        const targetIdx = elms.indexOf(target);
        return elms.filter((el, idx) => {
            return isAllow(idx, targetIdx) && el.tabIndex === this.options.dayIndex;
        })[0];
    }
    /**
     * Switch month via buttons (previous month, next month)
     *
     * @param evt
     */
    changeMonth(evt) {
        const arrows = {
            ArrowLeft: 'previous',
            ArrowRight: 'next',
        };
        const button = this.picker.ui.container.querySelector(`.${arrows[evt.code]}-button[tabindex="${this.options.unitIndex}"]`);
        if (button && !button.parentElement.classList.contains(`no-${arrows[evt.code]}-month`)) {
            button.dispatchEvent(new Event('click', { bubbles: true }));
            setTimeout(() => {
                let focusEl = null;
                switch (evt.code) {
                    case 'ArrowLeft':
                        // eslint-disable-next-line no-case-declarations
                        const elms = this.picker.ui.container.querySelectorAll(`.day[tabindex="${this.options.dayIndex}"]`);
                        focusEl = elms[elms.length - 1];
                        break;
                    case 'ArrowRight':
                        focusEl = this.picker.ui.container.querySelector(`.day[tabindex="${this.options.dayIndex}"]`);
                        break;
                }
                if (focusEl) {
                    focusEl.focus();
                }
            });
        }
    }
    /**
     * Handle ArrowUp and ArrowDown keys
     *
     * @param evt
     */
    verticalMove(evt) {
        const target = evt.target;
        if (target.classList.contains('day')) {
            evt.preventDefault();
            const nextElement = this.findAllowableDaySibling(this.picker.ui.container, target, (idx, targetIdx) => {
                targetIdx = evt.code === 'ArrowUp' ? targetIdx - 7 : targetIdx + 7;
                return idx === targetIdx;
            });
            if (nextElement) {
                nextElement.focus();
            }
        }
    }
    /**
     * Handle ArrowLeft and ArrowRight keys
     *
     * @param evt
     */
    horizontalMove(evt) {
        const target = evt.target;
        if (target.classList.contains('day')) {
            evt.preventDefault();
            const nextElement = this.findAllowableDaySibling(this.picker.ui.container, target, (idx, targetIdx) => {
                targetIdx = evt.code === 'ArrowLeft' ? targetIdx - 1 : targetIdx + 1;
                return idx === targetIdx;
            });
            if (nextElement) {
                nextElement.focus();
            }
            else {
                this.changeMonth(evt);
            }
        }
    }
    /**
     * Handle Enter and Space keys
     *
     * @param evt
     */
    handleEnter(evt) {
        const target = evt.target;
        if (target.classList.contains('day')) {
            evt.preventDefault();
            target.dispatchEvent(new Event('click', { bubbles: true }));
            setTimeout(() => {
                this.rangePlugin = this.picker.PluginManager.getInstance('RangePlugin');
                if (this.rangePlugin || !this.picker.options.autoApply) {
                    const currentFocus = this.picker.ui.container.querySelector('.day.selected');
                    if (currentFocus) {
                        setTimeout(() => { currentFocus.focus(); });
                    }
                }
            });
        }
    }
    /**
     * Manually fire `mouseenter` event to display date range correctly
     *
     * @param evt
     */
    onMouseEnter(evt) {
        const target = evt.target;
        if (target.classList.contains('day')) {
            setTimeout(() => {
                const e = this.picker.ui.shadowRoot.activeElement;
                if (e) {
                    e.dispatchEvent(new Event('mouseenter', { bubbles: true }));
                }
            });
        }
    }
}

class AmpPlugin extends BasePlugin {
    rangePlugin;
    lockPlugin;
    priority = 10;
    binds = {
        onView: this.onView.bind(this),
        onColorScheme: this.onColorScheme.bind(this),
    };
    options = {
        dropdown: {
            months: false,
            years: false,
            minYear: 1950,
            maxYear: null,
        },
        darkMode: true,
        locale: {
            resetButton: `<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>`
        },
    };
    matchMedia;
    /**
     * Returns plugin name
     *
     * @returns String
     */
    getName() {
        return 'AmpPlugin';
    }
    /**
     * - Called automatically via BasePlugin.attach() -
     * The function execute on initialize the picker
     */
    onAttach() {
        if (this.options.darkMode && window && 'matchMedia' in window) {
            this.matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
            if (this.matchMedia.matches) {
                this.picker.ui.container.dataset.theme = 'dark';
            }
            this.matchMedia.addEventListener('change', this.binds.onColorScheme);
        }
        if (this.options.weekNumbers) {
            this.picker.ui.container.classList.add('week-numbers');
        }
        this.picker.on('view', this.binds.onView);
    }
    /**
     * - Called automatically via BasePlugin.detach() -
     */
    onDetach() {
        if (this.options.darkMode && window && 'matchMedia' in window) {
            this.matchMedia.removeEventListener('change', this.binds.onColorScheme);
        }
        this.picker.ui.container.removeAttribute('data-theme');
        this.picker.ui.container.classList.remove('week-numbers');
        this.picker.off('view', this.binds.onView);
    }
    /**
     * Function `view` event
     * Adds `tabIndex` to the picker elements
     *
     * @param event
     */
    onView(event) {
        this.lockPlugin = this.picker.PluginManager.getInstance('LockPlugin');
        this.rangePlugin = this.picker.PluginManager.getInstance('RangePlugin');
        this.handleDropdown(event);
        this.handleResetButton(event);
        this.handleWeekNumbers(event);
    }
    /**
     *
     * @param evt
     */
    onColorScheme(evt) {
        const colorScheme = evt.matches ? 'dark' : 'light';
        this.picker.ui.container.dataset.theme = colorScheme;
    }
    /**
     *
     * @param evt
     */
    handleDropdown(evt) {
        const { view, target, date, index } = evt.detail;
        if (view === 'CalendarHeader') {
            const monthNameWrapper = target.querySelector('.month-name');
            if (this.options.dropdown.months) {
                monthNameWrapper.childNodes[0].remove();
                const selectMonths = document.createElement('select');
                selectMonths.className = 'month-name--select month-name--dropdown';
                for (let x = 0; x < 12; x += 1) {
                    const option = document.createElement('option');
                    // day 2 due to iOS bug (?) with `toLocaleString`
                    const monthName = new DateTime(new Date(date.getFullYear(), x, 2, 0, 0, 0));
                    const optionMonth = new DateTime(new Date(date.getFullYear(), x, 1, 0, 0, 0));
                    option.value = String(x);
                    option.text = monthName.toLocaleString(this.picker.options.lang, { month: 'long' });
                    if (this.lockPlugin) {
                        option.disabled = (this.lockPlugin.options.minDate
                            && optionMonth.isBefore(new DateTime(this.lockPlugin.options.minDate), 'month'))
                            || (this.lockPlugin.options.maxDate && optionMonth.isAfter(new DateTime(this.lockPlugin.options.maxDate), 'month'));
                    }
                    option.selected = optionMonth.getMonth() === date.getMonth();
                    selectMonths.appendChild(option);
                }
                selectMonths.addEventListener('change', (e) => {
                    const target = e.target;
                    this.picker.calendars[0].setDate(1);
                    this.picker.calendars[0].setMonth(Number(target.value));
                    this.picker.renderAll();
                });
                monthNameWrapper.prepend(selectMonths);
            }
            if (this.options.dropdown.years) {
                monthNameWrapper.childNodes[1].remove();
                const selectYears = document.createElement('select');
                selectYears.className = 'month-name--select';
                const minYear = this.options.dropdown.minYear;
                const maxYear = this.options.dropdown.maxYear ? this.options.dropdown.maxYear : (new Date()).getFullYear();
                if (date.getFullYear() > maxYear) {
                    const option = document.createElement('option');
                    option.value = String(date.getFullYear());
                    option.text = String(date.getFullYear());
                    option.selected = true;
                    option.disabled = true;
                    selectYears.appendChild(option);
                }
                for (let x = maxYear; x >= minYear; x -= 1) {
                    const option = document.createElement('option');
                    const optionYear = new DateTime(new Date(x, 0, 1, 0, 0, 0));
                    option.value = String(x);
                    option.text = String(x);
                    if (this.lockPlugin) {
                        option.disabled = (this.lockPlugin.options.minDate
                            && optionYear.isBefore(new DateTime(this.lockPlugin.options.minDate), 'year'))
                            || (this.lockPlugin.options.maxDate
                                && optionYear.isAfter(new DateTime(this.lockPlugin.options.maxDate), 'year'));
                    }
                    option.selected = date.getFullYear() === x;
                    selectYears.appendChild(option);
                }
                if (date.getFullYear() < minYear) {
                    const option = document.createElement('option');
                    option.value = String(date.getFullYear());
                    option.text = String(date.getFullYear());
                    option.selected = true;
                    option.disabled = true;
                    selectYears.appendChild(option);
                }
                if (this.options.dropdown.years === 'asc') {
                    const childs = Array.prototype.slice.call(selectYears.childNodes);
                    const options = childs.reverse();
                    selectYears.innerHTML = '';
                    options.forEach((y) => {
                        y.innerHTML = y.value;
                        selectYears.appendChild(y);
                    });
                }
                selectYears.addEventListener('change', (e) => {
                    const target = e.target;
                    this.picker.calendars[0].setFullYear(Number(target.value));
                    this.picker.renderAll();
                });
                monthNameWrapper.appendChild(selectYears);
            }
        }
    }
    /**
     *
     * @param event
     */
    handleResetButton(event) {
        const { view, target } = event.detail;
        if (view === 'CalendarHeader' && this.options.resetButton) {
            const button = document.createElement('button');
            button.className = 'reset-button unit';
            button.innerHTML = this.options.locale.resetButton;
            button.addEventListener('click', (evt) => {
                evt.preventDefault();
                let shouldReset = true;
                if (typeof this.options.resetButton === 'function') {
                    shouldReset = this.options.resetButton.call(this);
                }
                if (shouldReset) {
                    this.picker.clear();
                }
            });
            target.appendChild(button);
        }
    }
    /**
     *
     * @param event
     */
    handleWeekNumbers(event) {
        if (this.options.weekNumbers) {
            const { view, target } = event.detail;
            if (view === 'CalendarDayNames') {
                const w = document.createElement('div');
                w.className = 'wnum-header';
                w.innerHTML = 'Wk';
                target.prepend(w);
            }
            if (view === 'CalendarDays') {
                [...target.children].forEach((element, index) => {
                    if (index === 0 || index % 7 === 0) {
                        let date;
                        if (element.classList.contains('day')) {
                            date = new DateTime(element.dataset.time);
                        }
                        else {
                            const elDate = target.querySelector('.day');
                            date = new DateTime(elDate.dataset.time);
                        }
                        let weekNum = date.getWeek(this.picker.options.firstDay);
                        if (weekNum === 53 && date.getMonth() === 0) {
                            weekNum = '53/1';
                        }
                        const w = document.createElement('div');
                        w.className = 'wnum-item';
                        w.innerHTML = String(weekNum);
                        target.insertBefore(w, element);
                    }
                });
            }
        }
    }
}

export { AmpPlugin, DateTime, KbdPlugin, LockPlugin, PresetPlugin, RangePlugin, TimePlugin, Core as create, core as easepick };
