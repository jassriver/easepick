import { BasePlugin } from '@easepick/base-plugin';
import { DateTime } from '@easepick/datetime';

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

export { AmpPlugin };
