// Основной объект калькулятора
const Calculator = {
	// Элементы DOM
	elements: {
		taskInput: null,
		resultInput: null,
		memoryValue: null,
		historyList: null,
		historyCount: null,
		buttons: null,
		equalsButton: null
	},

	// Состояние калькулятора
	state: {
		memory: 0,
		history: [],
		lastResult: null
	},

	// Инициализация калькулятора
	init: function() {
		// Получение элементов DOM
		this.elements.taskInput = document.querySelector('.calc__input_type_task');
		this.elements.resultInput = document.querySelector('.calc__input_type_result');
		this.elements.memoryValue = document.getElementById('memoryValue');
		this.elements.historyList = document.getElementById('historyList');
		this.elements.historyCount = document.getElementById('historyCount');
		this.elements.buttons = document.querySelectorAll('.calc__button');
		this.elements.equalsButton = document.getElementById('equalsButton');

		// Загрузка состояния из localStorage
		this.loadState();

		// Настройка обработчиков событий
		this.setupEventListeners();

		// Обновление отображения
		this.updateDisplay();
	},

	// Загрузка состояния из localStorage
	loadState: function() {
		try {
			const savedMemory = localStorage.getItem('calculatorMemory');
			const savedHistory = localStorage.getItem('calculatorHistory');

			if (savedMemory !== null) {
				this.state.memory = parseFloat(savedMemory);
			}

			if (savedHistory !== null) {
				this.state.history = JSON.parse(savedHistory);
			}
		} catch (error) {
			console.error('Ошибка при загрузке состояния:', error);
		}
	},

	// Сохранение состояния в localStorage
	saveState: function() {
		try {
			localStorage.setItem('calculatorMemory', this.state.memory.toString());
			localStorage.setItem('calculatorHistory', JSON.stringify(this.state.history));
		} catch (error) {
			console.error('Ошибка при сохранении состояния:', error);
		}
	},

	// Настройка обработчиков событий
	setupEventListeners: function() {
		// Обработчики для кнопок
		this.elements.buttons.forEach(button => {
			button.addEventListener('click', () => {
				this.handleButtonClick(button.textContent, button.className, button.title);
			});
		});

		// Обработчик для поля ввода (поддержка клавиатуры)
		this.elements.taskInput.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				this.calculate();
			} else if (event.key === 'Escape') {
				this.clearAll();
			}
		});

		// Обработчик для кнопки "="
		this.elements.equalsButton.addEventListener('click', () => {
			this.calculate();
		});
	},

	// Обработка клика по кнопке
	handleButtonClick: function(buttonValue, buttonClass, buttonTitle) {
		// Обработка специальных кнопок
		if (buttonValue === 'C') {
			this.clearAll();
			return;
		} else if (buttonValue === '⌫') {
			this.backspace();
			return;
		} else if (buttonValue === '=') {
			this.calculate();
			return;
		}

		// Обработка кнопок памяти
		if (buttonClass.includes('calc__button_type_memory')) {
			this.handleMemory(buttonValue);
			return;
		}

		// Обработка кнопок операций
		let expressionToAdd = buttonValue;

		if (buttonValue === '×') {
			expressionToAdd = '*';
		} else if (buttonValue === 'xʸ') {
			expressionToAdd = '**';
		} else if (buttonValue === 'x⁻¹') {
			this.elements.taskInput.value += '**(-1)';
			return;
		} else if (buttonValue === 'ʸ√x') {
			this.elements.taskInput.value += '**(1/';
			return;
		} else if (buttonValue === 'x²') {
			this.elements.taskInput.value += '**2';
			return;
		} else if (buttonValue === '√x') {
			this.elements.taskInput.value += '**(1/2)';
			return;
		} else if (buttonValue === 'π') {
			expressionToAdd = 'Math.PI';
		} else if (buttonValue === 'e') {
			expressionToAdd = 'Math.E';
		} else if (buttonValue === 'sin') {
			expressionToAdd = 'Math.sin(';
		} else if (buttonValue === 'cos') {
			expressionToAdd = 'Math.cos(';
		} else if (buttonValue === 'tan') {
			expressionToAdd = 'Math.tan(';
		} else if (buttonValue === 'log2') {
			expressionToAdd = 'Math.log2(';
		} else if (buttonValue === 'log10') {
			expressionToAdd = 'Math.log10(';
		} else if (buttonValue === 'ln') {
			expressionToAdd = 'Math.log(';
		} else if (buttonValue === '!') {
			expressionToAdd = 'factorial(';
		}

		// Добавление выражения в поле ввода
		this.elements.taskInput.value += expressionToAdd;
		this.elements.taskInput.focus();
	},

	// Обработка операций с памятью
	handleMemory: function(operation) {
		const currentValue = this.getCurrentValue();

		switch (operation) {
			case 'MS':
				this.state.memory = currentValue;
				break;
			case 'MR':
				this.elements.taskInput.value += this.state.memory;
				break;
			case 'M+':
				this.state.memory += currentValue;
				break;
			case 'M-':
				this.state.memory -= currentValue;
				break;
			case 'MC':
				this.state.memory = 0;
				break;
		}

		this.updateDisplay();
		this.saveState();
	},

	// Вычисление выражения
	calculate: function() {
		try {
			let expression = this.elements.taskInput.value.trim();

			if (!expression) {
				this.elements.resultInput.value = '';
				return;
			}

			// Замена специальных символов
			expression = expression.replace(/π/g, 'Math.PI');
			expression = expression.replace(/e/g, 'Math.E');

			// Вычисление выражения
			const result = this.evaluateExpression(expression);

			// Обновление результата
			this.elements.resultInput.value = result;
			this.state.lastResult = result;

			// Добавление в историю
			this.addToHistory(expression, result);

			// Сохранение состояния
			this.saveState();

		} catch (error) {
			console.error('Ошибка вычисления:', error);
			this.elements.resultInput.value = 'Ошибка';
		}
	},

	// Вычисление математического выражения
	evaluateExpression: function(expression) {
		// Защита от опасного кода
		const safeExpression = expression.replace(/[^0-9+\-*/().,MathsincostanlogPIEA\s]/g, '');

		// Создание функции для вычисления факториала
		function factorial(n) {
			if (n < 0 || !Number.isInteger(n)) {
				throw new Error("Факториал определен только для целых неотрицательных чисел");
			}
			let result = 1;
			for (let i = 2; i <= n; i++) {
				result *= i;
			}
			return result;
		}

		// Вычисление выражения
		return Function('"use strict"; return (' + safeExpression + ')')();
	},

	// Добавление в историю
	addToHistory: function(expression, result) {
		const historyItem = {
			expression: expression,
			result: result,
			timestamp: new Date().toLocaleTimeString()
		};

		this.state.history.unshift(historyItem);

		// Ограничение истории 10 последними записями
		if (this.state.history.length > 10) {
			this.state.history = this.state.history.slice(0, 10);
		}

		this.updateHistoryDisplay();
	},

	// Очистка истории
	clearHistory: function() {
		this.state.history = [];
		this.updateHistoryDisplay();
		this.saveState();
	},

	// Получение текущего значения из поля ввода
	getCurrentValue: function() {
		try {
			const value = parseFloat(this.elements.taskInput.value);
			return isNaN(value) ? 0 : value;
		} catch (error) {
			return 0;
		}
	},

	// Очистка всего
	clearAll: function() {
		this.elements.taskInput.value = '';
		this.elements.resultInput.value = '';
		this.elements.taskInput.focus();
	},

	// Удаление последнего символа
	backspace: function() {
		this.elements.taskInput.value = this.elements.taskInput.value.slice(0, -1);
		this.elements.taskInput.focus();
	},

	// Обновление отображения
	updateDisplay: function() {
		this.elements.memoryValue.textContent = this.state.memory.toFixed(6);
		this.updateHistoryDisplay();
	},

	// Обновление отображения истории
	updateHistoryDisplay: function() {
		this.elements.historyList.innerHTML = '';
		this.elements.historyCount.textContent = this.state.history.length;

		if (this.state.history.length === 0) {
			const emptyItem = document.createElement('li');
			emptyItem.className = 'nav__item';
			emptyItem.textContent = 'История пуста';
			this.elements.historyList.appendChild(emptyItem);
			return;
		}

		this.state.history.forEach(item => {
			const historyItem = document.createElement('li');
			historyItem.className = 'nav__item';
			historyItem.title = `Вычислено в ${item.timestamp}`;
			historyItem.innerHTML = `
<div style="font-size: 0.8rem; color: #aaa;">${item.expression}</div>
<div style="color: #2ecc71; font-weight: bold;">= ${item.result}</div>
`;

			// При клике на элемент истории вставляем его выражение
			historyItem.addEventListener('click', () => {
				this.elements.taskInput.value = item.expression;
				this.elements.taskInput.focus();
			});

			this.elements.historyList.appendChild(historyItem);
		});
	}
};

// Функции для навигации
function insertFunction(func) {
	const taskInput = document.querySelector('.calc__input_type_task');
	taskInput.value += func;
	taskInput.focus();
}

function insertConstant(constant) {
	const taskInput = document.querySelector('.calc__input_type_task');
	taskInput.value += constant;
	taskInput.focus();
}

// Инициализация калькулятора при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
	Calculator.init();
});