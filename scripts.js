window.onload = function() {
	/* variables
	shipSide	- размер палубы
	user.field 	- игровое поле пользователя
	comp.field 	- игровое поле компьютера
	user.fieldX,
	user.fieldY	- координаты игрового поля пользователя
	comp.fieldX,
	comp.fieldY	- координаты игрового поля компьютера

	0 - пустое место
	1 - палуба корабля
	2 - клетка рядом с кораблём
	3 - обстрелянная клетка
	4 - попадание в палубу
	*/

	'use strict';

	function Field(field) {
		// размер стороны игрового поля в px
		this.fieldSide	= 330,
		// размер палубы корабля в px
		this.shipSide	= 33,
		// массив с данными кораблей
		// в качестве его элементов выступают массивы содержащие количество палуб и тип кораблей
		// индекс элемента массива будет соответствовать количеству кораблей, данные о которых
		// содержатся в данном элементе
		// чтобы описанная структура была корректной, используем пустой нулевой элемент
		this.shipsData	= [
			'',
			[4, 'fourdeck'],
			[3, 'tripledeck'],
			[2, 'doubledeck'],
			[1, 'singledeck']
		],
		// объект игрового поля, полученный в качестве аргумента
		this.field		= field;
		// получаем координаты всех четырёх сторон рамки игрового поля относительно начала
		// document, с учётом возможной прокрутки по вертикали 
		this.fieldX		= field.getBoundingClientRect().top + window.pageYOffset;
		this.fieldY		= field.getBoundingClientRect().left + window.pageXOffset;
		this.fieldRight	= this.fieldY + this.fieldSide;
		this.fieldBtm	= this.fieldX + this.fieldSide;
		// создаём пустой массив, куда будем заносить данные по каждому созданному кораблю
		// эскадры, подробно эти данные рассмотрим при создании объектов кораблей
		this.squadron	= [];
		// флаг начала игры, устанавливается после нажатия кнопки 'Play' и запрещает
		// редактирование положения кораблей
		this.startGame	= false;
	}

	Field.prototype.randomLocationShips = function() {
		// создаём двумерный массив, в который будем записывать полученные координаты
		// палуб корабля, а в дальнейшем, координаты выстрелов, попаданий и клеток
		// игрового поля, где кораблей точно быть не может
		this.matrix = createMatrix();

		for (var i = 1, length = this.shipsData.length; i < length; i++) {
			// i равно количеству кораблей, создаваемых для типа корабля в данной итерации
			// ещё раз напомню на примере:
			// элемент [3, 'tripledeck'] имеет индекс 2 в массиве shipsData, значит
			// должно быть два трёхпалубных корабля
			// индекс элемента [2, 'doubledeck'] равен 3, значит должно быть создано
			// три двухпалубных корабля
			// и так по каждому элементу массива

			// количество палуб у текущего типа кораблей
			var decks = this.shipsData[i][0]; // кол-во палуб
			for (var j = 0; j < i; j++) {
				// получаем координаты первой палубы и направление расположения палуб (корабля)
				var fc = this.getCoordinatesDecks(decks);

				// добавим объекту 'fc' два новых свойства
				//количество палуб
				fc.decks 	= decks,
				// и уникальное имя корабля, которое будет использоваться в качестве его 'id'
				fc.shipname	= this.shipsData[i][1] + String(j + 1);

					// создаём экземпляр объекта корабля с помощью конструктора 'Ships'
				var ship = new Ships(this, fc);
					// генерируем новый корабль и выводим его на экран монитора	
					ship.createShip();
			}
		}
	}

	Field.prototype.getCoordinatesDecks = function(decks) {
		// получаем коэфициенты определяющие направление расположения корабля
		// kx == 0 и ky == 1 — корабль расположен горизонтально,
		// kx == 1 и ky == 0 - вертикально.
		var kx = getRandom(1),
			ky = (kx == 0) ? 1 : 0,
			x, y;
		// в зависимости от направления расположения, генерируем
		// начальные координаты
		if (kx == 0) {
			x = getRandom(9);
			y = getRandom(10 - decks);
		} else {
			x = getRandom(10 - decks);
			y = getRandom(9);
		}

		// проверяем валидность координат всех палуб корабля:
		// нет ли в полученных координатах или соседних клетках ранее
		// созданных кораблей
		var result = this.checkLocationShip(x, y, kx, ky, decks);
		// если координаты невалидны, снова запускаем функцию
		if (!result) return this.getCoordinatesDecks(decks);

		// создаём объект, свойствами которого будут начальные координаты и
		// коэфициенты определяющие направления палуб
		var obj = {
			x: x,
			y: y,
			kx: kx,
			ky: ky
		};
		return obj;
	}

	Field.prototype.checkLocationShip = function(x, y, kx, ky, decks) {
		// зарегистрируем переменные
		var fromX, toX, fromY, toY;

		// формируем индексы начала и конца цикла для строк
		// если координата 'x' равна нулю, то это значит, что палуба расположена в самой верхней строке,
		// т. е. примыкает к верхней границе и началом цикла будет строка с индексом 0
		// в противном случае, нужно начать проверку со строки с индексом на единицу меньшим, чем у
		// исходной, т.е. находящейся выше исходной строки
		fromX = (x == 0) ? x : x - 1;
		// если условие истинно - это значит, что корабль расположен вертикально и его последняя палуба примыкает
		// к нижней границе игрового поля
		// поэтому координата 'x' последней палубы будет индексом конца цикла
		if (x + kx * decks == 10 && kx == 1) toX = x + kx * decks;
		// корабль расположен вертикально и между ним и нижней границей игрового поля есть, как минимум, ещё
		// одна строка, координата этой строки и будет индексом конца цикла
		else if (x + kx * decks < 10 && kx == 1) toX = x + kx * decks + 1;
		// корабль расположен горизонтально вдоль нижней границы игрового поля
		else if (x == 9 && kx == 0) toX = x + 1;
		// корабль расположен горизонтально где-то по середине игрового поля
		else if (x < 9 && kx == 0) toX = x + 2;

		// формируем индексы начала и конца цикла для столбцов
		// принцип такой же, как и для строк
		fromY = (y == 0) ? y : y - 1;
		if (y + ky * decks == 10 && ky == 1) toY = y + ky * decks;
		else if (y + ky * decks < 10 && ky == 1) toY = y + ky * decks + 1;
		else if (y == 9 && ky == 0) toY = y + 1;
		else if (y < 9 && ky == 0) toY = y + 2;

		// если корабль при повороте выходит за границы игрового поля
		// т.к. поворот происходит относительно первой палубы, то 
		// fromX и fromY, всегда валидны
		if (toX === undefined || toY === undefined) return false;

		for (var i = fromX; i < toX; i++) {
			for (var j = fromY; j < toY; j++) {
				if (this.matrix[i][j] == 1) return false;
			}
		}
		return true;
	}

	Field.prototype.cleanField = function() {
			// создаём объект игрового поля, на котором должны быть удалены корабли
		var parent	= this.field,
			// получаем значение атрибута 'id', которое понадобится для дальнейшей
			// DOM-навигации
			id		= parent.getAttribute('id'),
			// получаем коллекцию все кораблей, которые нужно удалить
			divs 	= document.querySelectorAll('#' + id + ' > div');

		// перебираем в цикле полученную коллекцию и удаляем входящие в неё корабли
		[].forEach.call(divs, function(el) {
			parent.removeChild(el);
		});
		// очищаем массив объектов кораблей
		this.squadron.length = 0;
	}

	// зарегистрируем переменные и присвои им значения полученных элементов игровых полей
	// эти переменные ещё несколько раз понадобятся нам при написании скрипта
	var userfield = getElement('field_user'),
		compfield = getElement('field_comp'),
		comp;
	// с помощью конструктора создаём объект user, за его основу взято поле игрока
	var user = new Field(getElement('field_user'));

	/////////////////////////////////////////

	function Ships(player, fc) {
		// на каком поле создаётся данный корабль
		this.player 	= player;
		// уникальное имя корабля
		this.shipname 	= fc.shipname;
		//количество палуб
		this.decks		= fc.decks;
		// координата X первой палубы
		this.x0			= fc.x;
	 	// координата Y первой палубы
		this.y0			= fc.y;
		// направлении расположения палуб
		this.kx			= fc.kx;
		this.ky 		= fc.ky;
		// счётчик попаданий
		this.hits 		= 0;
		// массив с координатами палуб корабля
		this.matrix		= [];
	}

	Ships.prototype.createShip = function() {
		var k		= 0,
			x		= this.x0,
			y		= this.y0,
			kx		= this.kx,
			ky		= this.ky,
			decks	= this.decks,
			player	= this.player

		// количество циклов будет равно количеству палуб создаваемого корабля
		while (k < decks) {
			// записываем координаты корабля в матрицу игрового поля
			// теперь наглядно должно быть видно зачем мы создавали два
			// коэфициента направления палуб
			// если коэфициент равен 1, то соотвествующая координата будет
			// увеличиваться при каждой итерации
			// если равен нулю, то координата будет оставаться неизменной
			// таким способом мы очень сократили и унифицировали код
			// значение 1, записанное в ячейку двумерного массива, говорит о том, что
			// по данным координатам находится палуба некого корабля
			player.matrix[x + k * kx][y + k * ky] = 1;
			// записываем координаты корабля в матрицу экземпляра корабля
			this.matrix.push([x + k * kx, y + k * ky]);
			k++;
		}

		// заносим информацию о созданном корабле в массив эскадры
		player.squadron.push(this);
		// если корабль создан для игрока, выводим его на экран
		if (player == user) this.showShip();
		// когда количество кораблей в эскадре достигнет 10, т.е. все корабли
		// сгенерированны, то можно показать кнопку запуска игры
		if (user.squadron.length == 10) {
			getElement('play').setAttribute('data-hidden', 'false');
		}
	}

	Ships.prototype.showShip = function() {
			// создаём новый элемент с указанным тегом
		var div			= document.createElement('div'),
			// присваиваем имя класса в зависимости от направления расположения корабля
			dir			= (this.kx == 1) ? ' vertical' : '',
			// из имени корабля убираем цифры и получаем имя класса
			classname	= this.shipname.slice(0, -1),
			player		= this.player;

		// устанавливаем уникальный идентификатор для корабля
		div.setAttribute('id', this.shipname);
		// собираем в одну строку все классы 
		div.className = 'ship ' + classname + dir;
		// через атрибут 'style' задаём позиционирование кораблю относительно
		// его родительского элемента
		// смещение вычисляется путём умножения координаты первой палубы на
		// размер клетки игрового поля, этот размер совпадает с размером палубы
		div.style.cssText = 'left:' + (this.y0 * player.shipSide) + 'px; top:' + (this.x0 * player.shipSide) + 'px;';
		player.field.appendChild(div);
	}


	/////////////////////////////////////////

	function Instance() {
		this.pressed = false;
	}

	Instance.prototype.setObserver = function() {
			// поле для кораблей игрока
		var fieldUser		= getElement('field_user'),
			// контейнер, в котором изначально находятся корабли
			initialShips	= getElement('ships_collection');

		// нажатие на левую кнопку мышки
		fieldUser.addEventListener('mousedown', this.onMouseDown.bind(this));
		// нажатие на правую кнопку мышки
		fieldUser.addEventListener('contextmenu', this.rotationShip.bind(this));
		// нажатие на левую кнопку мышки
		initialShips.addEventListener('mousedown', this.onMouseDown.bind(this));
		// перемещение мышки с нажатой кнопкой
		document.addEventListener('mousemove', this.onMouseMove.bind(this));
		// отпускание левой кнопки мышки
		document.addEventListener('mouseup', this.onMouseUp.bind(this));
	}

	Instance.prototype.onMouseDown = function(e) {
		// если нажатие не на левую кнопку или игра запущена
		//  прекращаем работу функции
		if (e.which != 1 || userfield.startGame) return;
		// ищем корабль, ближайший к координатам нажатия на кнопку
		var el = e.target.closest('.ship');
		// если корабль не найден, прекращаем работу функции
		if (!el) return;
		// выставляем флаг нажатия на левую кнопку мышки
		this.pressed = true;

		// запоминаем переносимый объект и его свойства
		this.draggable = {
			elem:	el,
			//запоминаем координаты, с которых начат перенос
			downX:	e.pageX,
			downY:	e.pageY,
			kx:		0,
			ky:		1
		};

		// нажатие мыши произошло по установленному кораблю, находящемуся
		// в игровом поле юзера (редактирование положения корабля)
		if (el.parentElement.getAttribute('id') == 'field_user') {
			// получаем имя корабля и вызываем функцию, определяющую направление
			// его положения
			var name = el.getAttribute('id');
			this.getDirectionShip(name);

			// получаем значения смещения корабля относительно игрового поля и
			// записываем эти значения в объект draggable
			// используя метод slice, убираем единицы измерения (px) смещения
			var computedStyle	= getComputedStyle(el);
			this.draggable.left	= computedStyle.left.slice(0, -2);
			this.draggable.top	= computedStyle.top.slice(0, -2);

			// удаляем экземпляр корабля
			this.cleanShip(el);
		}
		return false;
	}

	Instance.prototype.onMouseMove = function(e) {
		if (this.pressed == false || !this.draggable.elem) return;

		var coords;

		// посчитать дистанцию, на которую переместился курсор мыши
		/*var moveX = e.pageX - this.draggable.downX,
			moveY = e.pageY - this.draggable.downY;
		if (Math.abs(moveX) < 3 && Math.abs(moveY) < 3) return;*/

		if (!this.clone) {
			// используем отдельную функцию для создания клона
			this.clone = this.creatClone(e);
			// еслине удалось создать clone
			if (!this.clone) return;
			
			// получаем координаты клона
			coords = getCoords(this.clone);
			// вычисляем сдвиг курсора по координатам X и Y
			this.shiftX = this.draggable.downX - coords.left;
			this.shiftY = this.draggable.downY - coords.top;
			// перемещаем клон в BODY
			document.body.appendChild(this.clone);
			// задаём стили для возможности позиционирования клона
			// относительно документа
			this.clone.style.zIndex = '1000';
			// получаем количество палуб у перемещаемого корабля
			this.decks = this.getCountDecks();
		}

			// координаты сторон аватара по оси X
		var currLeft	= e.pageX - this.shiftX,
			// координаты сторон аватара по оси Y
			currTop		= e.pageY - this.shiftY;

		// присваиваем клону новые координаты абсолютного позиционирования относительно BODY
		this.clone.style.left = currLeft + 'px';
		this.clone.style.top = currTop + 'px';

		coords = getCoords(this.clone);

			// координата нижней стороны
		var currBtm		= coords.bottom,
			// координата правой стороны
			currRight	= coords.right;

		if (currLeft >= user.fieldY - 14 && currRight <= user.fieldRight + 14 && currTop >= user.fieldX - 14 && currBtm <= user.fieldBtm + 14) {
			// получаем координаты привязанные в сетке поля и в координатах матрицы
			var	coords = this.getCoordsClone(this.decks);
			// проверяем валидность установленных координат
			var result = user.checkLocationShip(coords.x, coords.y, this.draggable.kx, this.draggable.ky, this.decks);

			if (result) {
				// клон находится в пределах игрового поля, поэтому
				// подсвечиваем его контур зелёным цветом
				this.clone.classList.remove('unsuccess');
				this.clone.classList.add('success');
			} else {
				// в соседних клетках находятся ранее установленные корабли,
				// поэтому контур клона подсвечен красным цветом
				this.clone.classList.remove('success');
				this.clone.classList.add('unsuccess');
			}
		} else {
			// клон за пределами игрового поля, поэтому его контур
			// подсвечен красным цветом
			this.clone.classList.remove('success');
			this.clone.classList.add('unsuccess');
		}
		return false;
	}

	Instance.prototype.onMouseUp = function(e) {
		// сбрасываем флаг нажатия на левую кнопку мыши
		this.pressed = false;
		// если перетаскиваемого объекта не существует, выходим из обработчика событий
		if (!this.clone) return;

		// попытка поставить корабль вне игрового поля или в нарушении правил
		if (this.clone.classList.contains('unsuccess')) {
			// удаляем класс подсвечивающий контур корабля красным цветом
			this.clone.classList.remove('unsuccess');
			// возвращаем корабль в исходную позицию из которой было начато перемещение
			this.clone.rollback();

			// используется при редактировании положения корабля
			// без этого кода корабль будет возвращаться в левый верхний угол игрового поля
			if (this.draggable.left !== undefined && this.draggable.top !== undefined) {
				// возвращаем корабль на позицию определённую значениями 'left' и 'top',
				// которые были сохранены в объекте 'draggable'
				this.draggable.elem.style.cssText = 'left:' + this.draggable.left + 'px; top:' + this.draggable.top + 'px;';
			}
		} else {
			// получаем координаты привязанные в сетке поля и в координатах матрицы
			var	coords = this.getCoordsClone(this.decks);
			// переносим клон внутрь игрового поля
			user.field.appendChild(this.clone);
			// прописываем координаты клона относительно игрового поля
			this.clone.style.left = coords.left + 'px';
			this.clone.style.top = coords.top + 'px';

			// создаём объект со свойствами корабля
			var	fc = {
					'shipname': this.clone.getAttribute('id'),
					'x': coords.x,
					'y': coords.y,
					'kx': this.draggable.kx,
					'ky': this.draggable.ky,
					'decks': this.decks
				},
				// создаём экземпляр корабля
				ship = new Ships(user, fc);

			ship.createShip();
			// удаляем z-index, т.к. нет необходимости, чтобы корабль был
			// поверх ВСЕХ элементов
			getElement(ship.shipname).style.zIndex = null;
			// теперь в игровом поле находится сам корабль, поэтому его клон удаляем
			getElement('field_user').removeChild(this.clone);
		}

		// удаляем объекты 'clone' и 'draggable'
		this.cleanClone();
		return false;
	}

	Instance.prototype.creatClone = function(e) {
			// создаём клон корабля
		var clone	= this.draggable.elem,
			// запоминаем исходное положение перетаскиваемого корабля
			// и его родительский элемент
			old		= {
				parent:			clone.parentNode,
				nextSibling:	clone.nextSibling,
				left:			clone.left || '',
				top:			clone.top || '',
				zIndex:			clone.zIndex || ''
			};

		// после создания клона, добавляем ему метод 'rollback', который
		// в случае неудачного переноса, возвращает корабль на исходную позицию,
		// присваивая клону ранее запомненные стили
		clone.rollback = function() {
			old.parent.insertBefore(clone, old.nextSibling);
			clone.style.left = old.left;
			clone.style.top = old.top;
			clone.style.zIndex = old.zIndex;
		};
		return clone;
	}

	Instance.prototype.findDroppable = function(e) {
		this.clone.hidden = true;
		var el = document.elementFromPoint(e.clientX, e.clientY);
		this.clone.hidden = false;
		return el.closest('.ships');
	}

	Instance.prototype.getCountDecks = function() {
		// получаем тип корабля
		var type = this.clone.getAttribute('id').slice(0, -1);
		// перебираем массив shipsData и находим количество палуб
		// у корабля данного типа
		for (var i = 1, length = user.shipsData.length; i < length; i++) {
			if (user.shipsData[i][1] === type) {
				return user.shipsData[i][0];
			}
		}
	}

	Instance.prototype.getCoordsClone = function(decks) {
			// получаем значения всех координат клона
		var pos		= this.clone.getBoundingClientRect(),
			// вычисляем разность между координатой стороны клона и
			// координатой соответствующей стороны игрового поля
			left	= pos.left - user.fieldY,
			right	= pos.right - user.fieldY,
			top		= pos.top - user.fieldX,
			bottom	= pos.bottom - user.fieldX,
			// создаём объект, куда поместим итоговые значения
			coords	= {};

		// в результате выполнения условия, убираем неточности позиционирования
		coords.top	= (top < 0) ? 0 : (bottom > user.fieldSide) ? user.fieldSide - user.shipSide : top;
		coords.top	= Math.round(coords.top / user.shipSide) * user.shipSide;
		// получаем значение в координатах матрицы по оси X
		coords.x	= coords.top / user.shipSide;

		coords.left = (left < 0) ? 0 : (right > user.fieldSide) ? user.fieldSide - user.shipSide * decks : left;
		coords.left = Math.round(coords.left / user.shipSide) * user.shipSide;
		coords.y	= coords.left / user.shipSide;
		return coords;
	}

	Instance.prototype.cleanClone = function() {
		delete this.clone;
		delete this.draggable;
	}

	Instance.prototype.rotationShip = function(e) {
		// проверяем, что нажата именно правая кнопка мыши
		// если установлен флаг начала игры, прекращаем работу
		// функции
		if (e.which != 3 || userfield.startGame) {
			// запрещаем появление контекстного меню при выходе из функции
			e.preventDefault();
			return;
		}
		// отменяем действие браузера по умолчанию
		e.preventDefault();
		e.stopPropagation();

		// получаем id корабля
		var id = e.target.getAttribute('id');

		// ищем корабль, у которого имя совпадает с полученным id
		for (var i = 0, length = user.squadron.length; i < length; i++) {
			// в переменной data сохраняем всю информацию по кораблю из текущей итерации
			var data = user.squadron[i];
			// сравниваем имя корабля с полученным id
			// у корабля должно быть больше одной палубы - нет смысла вращать однопалубник
			if (data.shipname == id && data.decks != 1) {
				// меняем значение коэффициэнтов на противоположные
				var kx	= (data.kx == 0) ? 1 : 0,
					ky	= (data.ky == 0) ? 1 : 0;

				// удаляем экземпляр корабля
				this.cleanShip(e.target);
				user.field.removeChild(e.target);

				// проверяем валидность координат
				var result = user.checkLocationShip(data.x0, data.y0, kx, ky, data.decks);
				if (result === false) {
					// если новые координаты валидацию не прошли, возвращаем коэффициэнтам
					// предыдущие значения
					var kx	= (kx == 0) ? 1 : 0,
						ky	= (ky == 0) ? 1 : 0;
				}

				// создаём экземпляр корабля
				var	fc = {
						'shipname': data.shipname,
						'x': data.x0,
						'y': data.y0,
						'kx': kx,
						'ky': ky,
						'decks': data.decks
					},
					ship = new Ships(user, fc);

				ship.createShip();

				// подсвечиваем рамку корабля красным цветом, присваивая ему на 0.5 сек.
				// класс 'unsuccess'
				if (result === false) {
					var el = getElement(ship.shipname);
					el.classList.add('unsuccess');
					setTimeout(function() {
						el.classList.remove('unsuccess');
					}, 500);
				}
			}
		}
		return false;
	}


	Instance.prototype.cleanShip = function(el) {
		// получаем координаты в матрице
		var coords = el.getBoundingClientRect(),
			x = Math.round((coords.top - user.fieldX) / user.shipSide),
			y = Math.round((coords.left - user.fieldY) / user.shipSide),
			data, k;

		// ищем корабль, которому принадлежат данные координаты
		for (var i = 0, length = user.squadron.length; i < length; i++) {
			data = user.squadron[i];
			if (data.x0 == x && data.y0 == y) {
				// удаляем из матрицы координаты корабля
				k = 0;
				while(k < data.decks) {
					user.matrix[x + k * data.kx][y + k * data.ky] = 0;
					k++;
				}
				// удаляем корабль из массива 
				user.squadron.splice(i, 1);
				return;
			}
		}
	}

	Instance.prototype.getDirectionShip = function(shipname) {
		var data;
		// обходим массив с данными кораблей игрока
		for (var i = 0, length = user.squadron.length; i < length; i++) {
			// записываем в переменную информацию по текущему кораблю
			data = user.squadron[i];
			// если имя текущего корабля массива и редактируемого совпадают, то
			// записываем значения kx и ky в объект draggable
			if (data.shipname === shipname) {
				this.draggable.kx = data.kx;
				this.draggable.ky = data.ky;
				return;
			}
		}
	}

	/////////////////////////////////////////

	getElement('type_placement').addEventListener('click', function(e) {
		// используем делегирование основанное на всплытии событий
		var el = e.target;
		if (el.tagName != 'SPAN') return;

		// получаем объект в котором находится коллекция кораблей
		// для перетаскивания
		var shipsCollection = getElement('ships_collection');
		// если мы уже создали эскадру ранее, то видна кнопка начала игры
		// скроем её на время расстановки кораблей новой эскадры
		getElement('play').setAttribute('data-hidden', true);
		// очищаем матрицу
		user.cleanField();

		var type = el.getAttribute('data-target'),
			// создаём литеральный объект typeGeneration
			// каждому свойству литерального объекта соотвествует анонимная функция
			// в которой вызывается рандомная или ручная расстановка кораблей
			typeGeneration = {
				'random': function() {
					// если мы хотели самостоятельно расставить корабли, а потом решили
					// сделать это рандомно, то скрываем корабали для перетаскивания
					shipsCollection.setAttribute('data-hidden', true);
					user.randomLocationShips();
				},
				'manually': function() {
					// создаём двумерный массив, в который будем записывать полученные координаты
					// палуб кораблей, а в дальнейшем, координаты выстрелов компьютера, попаданий
					// и клеток игрового поля, где кораблей точно быть не может
					user.matrix = createMatrix();

					// проверяем, видна ли первоначальная дислокация кораблей
					// используя данное условие, мы можем при повторных клика
					// на псевдо-ссылку Самостоятельно с чистого листа
					// показывать / скрывать первоначальную дислокацию
					if (shipsCollection.getAttribute('data-hidden') === 'true') {
						// показываем объект
						shipsCollection.setAttribute('data-hidden', false);
						// создаём экземпляр объекта с помощью конструктора Instance
						var instance = new Instance();
						// и устанавливаем обработчики событий мыши
						instance.setObserver();
					} else {
						// скрываем объект
						shipsCollection.setAttribute('data-hidden', true);
					}
				}
			};
		// вызов анонимной функции литерального объекта в зависимости
		// от значения атрибута 'data-target'
		typeGeneration[type]();
	});

	getElement('play').addEventListener('click', function(e) {
		// скрываем блок инструкции и выбора способа расстановки кораблей
		getElement('instruction').setAttribute('data-hidden', true);

		// показываем поле компьютера, создаём объект поля компьютера и расставляем корабли
		document.querySelector('.field-comp').setAttribute('data-hidden', false);
		comp = new Field(compfield);
		comp.randomLocationShips();

		// скрываем кнопку запуска игры
		getElement('play').setAttribute('data-hidden', true);
		// выводим сообщение над игровыми полями
		getElement('text_top').innerHTML = 'Морской бой между эскадрами';

		// устанавливаем флаг начала игры для запрета редактирования положения кораблей
		userfield.startGame = true;

		// Запуск инициализации модуля игры
		Controller.battle.init();
	});

	/////////////////////////////////////////

	var Controller = (function() {
		// объявляем переменные
		var player, enemy, self, coords, text,
			srvText = getElement('text_btm'),
			tm = 0;

		// литеральный объект
		var battle = {
			// инициализация игры
			init: function() {
				self = this;
				// рандомно определяем кто будет стрелять первым: человек или компьютер
				var rnd = getRandom(1);
				player = (rnd == 0) ? user : comp;
				// определяем, кто будет противником, т.е. чей выстрел следующий
				enemy = (player === user) ? comp : user;

				// массив с координатами выстрелов при рандомном выборе
				comp.shootMatrix = [];
				// массив с координатами выстрелов для AI
				comp.shootMatrixAI = [];
				// массив с координатами вокруг клетки с попаданием
				comp.shootMatrixAround = [];
				// массив координат начала циклов
				comp.startPoints = [
					[ [6,0], [2,0], [0,2], [0,6] ],
					[ [3,0], [7,0], [9,2], [9,6] ]
				];

				// создаём временный объект корабля 'tempShip' куда будем заносить
				// координаты попаданий, расположение корабля, количество попаданий
				self.resetTempShip();

				// генерируем координаты выстрелов компьютера в соответствии
				// с рассмотренной стратегией и заносим их в массивы
				// shootMatrix и shootMatrixAI
				self.setShootMatrix();

				// первым стреляет человек
				if (player === user) {
					// устанавливаем на игровое поле компьютера обработчики событий
					// регистрируем обработчик выстрела
					compfield.addEventListener('click', self.shoot);
					// регистрируем обработчик визуальной отметки клеток, в которых
					// однозначно не может быть кораблей противника
					compfield.addEventListener('contextmenu', self.setEmptyCell);
					// выводим сообщение о том, что первый выстрел за пользователем
					self.showServiseText('Вы стреляете первым.');
				} else {
					// выводим сообщение о том, что первый выстрел за компьютером
					self.showServiseText('Первым стреляет компьютер.');
					// вызываем функцию выстрела
					setTimeout(function() {
						return self.shoot();
					}, 100);
				}
			},

			// обработка выстрела			
			shoot: function(e) {
				// e !== undefined - значит выстрел производит игрок
				// координаты поступают по клику в px и преобразуются в координаты матрицы (coords)
				if (e !== undefined) {
					// если клик сделан не левой кнопкой мыши, прекращаем работу функции
					if (e.which != 1) return false;
					// преобразуем координаты выстрела в координаты матрицы
					coords = self.transformCoordinates(e, enemy);
				} else {
					// получаем координаты для выстрела компьютера
					coords = self.getCoordinatesShot();
				}

				// значение матрицы по полученным координатам
				var val	= enemy.matrix[coords.x][coords.y];
				switch(val) {
					// промах
					case 0:
						// устанавливаем иконку промаха и записываем промах в матрицу
						self.showIcons(enemy, coords, 'dot');
						enemy.matrix[coords.x][coords.y] = 3;

						// выводим сообщение о промахе в нижней части экрана
						text = (player === user) ? 'Вы промахнулись. Стреляет компьютер.' : 'Компьютер промахнулся. Ваш выстрел.';
						self.showServiseText(text);

						// определяем, чей выстрел следующий
						player = (player === user) ? comp : user;
						enemy = (player === user) ? comp : user;

						if (player == comp) {
							// снимаем обработчики событий для пользователя
							compfield.removeEventListener('click', self.shoot);
							compfield.removeEventListener('contextmenu', self.setEmptyCell);

							// если в массиве нет координат, сбрасываем объект к исходным значениям
							if (comp.shootMatrixAround.length == 0) {
								self.resetTempShip();
							}

							// запускаем функцию shoot для выстрела компьютера
							setTimeout(function() {
								return self.shoot();
							}, 100);
						} else {
							// устанавливаем обработчики событий для пользователя
							compfield.addEventListener('click', self.shoot);
							compfield.addEventListener('contextmenu', self.setEmptyCell);
						}
						break;

					// попадание
					case 1:
						// записываем в матрицу значение '4', которое соответствует попаданию
						enemy.matrix[coords.x][coords.y] = 4;
						// отображаем иконку попадания
						self.showIcons(enemy, coords, 'red-cross');
						// выводим сообщение о попадании в нижней части экрана
						text = (player === user) ? 'Поздравляем! Вы попали. Ваш выстрел.' : 'Компьютер попал в ваш корабль. Выстрел компьютера';
						self.showServiseText(text);

						// перебор массива начнём с конца, для получения корректных значений
						// при возможном удалении его элементов
						for (var i = enemy.squadron.length - 1; i >= 0; i--) {
							var warship		= enemy.squadron[i], // вся информация о корабле эскадры
								arrayDescks	= warship.matrix; // массив с координатами палуб корабля

							// перебираем координаты палуб корабля
							for (var j = 0, length = arrayDescks.length; j < length; j++) {
								// если координаты одной из палуб корабля совпали с координатами выстрела
								// увеличиванием счётчик попаданий
								if (arrayDescks[j][0] == coords.x && arrayDescks[j][1] == coords.y) {
									warship.hits++;

									// если кол-во попаданий в корабль становится равным кол-ву палуб
									// считаем этот корабль уничтоженным и удаляем его из эскадры,
									// но перед этим сохраняем координаты первой палубы удаляемого корабля
									// понадобятся для отметки клеток по краям корабля
									if (warship.hits == warship.decks) {
										if (player === comp) {
											// сохраняем координаты первой палубы
											comp.tempShip.x0 = warship.x0;
											comp.tempShip.y0 = warship.y0;
										}
										enemy.squadron.splice(i, 1);
									}
									// выходим из цикла, т.к. палуба найдена
									break;
								}
							}
						}

						// игра закончена, все корабли эскадры противника уничтожены
						if (enemy.squadron.length == 0) {
							text = (player === user) ? 'Поздравляем! Вы выиграли.' : 'К сожалению, вы проиграли.';
							//text += ' Хотите продолжить игру?';
							srvText.innerHTML = text;

							getElement('btn-repeat').setAttribute('data-hidden', false);

							// победа игрока
							if (player == user) {
								// снимаем обработчики событий для пользователя
								compfield.removeEventListener('click', self.shoot);
								compfield.removeEventListener('contextmenu', self.setEmptyCell);
							// победа компьютера
							} else {
								// если выиграл комп., показываем оставшиеся корабли компьютера
								for (var i = 0, length = comp.squadron.length; i < length; i++) {
									var div			= document.createElement('div'),
										dir			= (comp.squadron[i].kx == 1) ? ' vertical' : '',
										classname	= comp.squadron[i].shipname.slice(0, -1);

									div.className = 'ship ' + classname + dir;
									div.style.cssText = 'left:' + (comp.squadron[i].y0 * comp.shipSide) + 'px; top:' + (comp.squadron[i].x0 * comp.shipSide) + 'px;';
									comp.field.appendChild(div);
								}
							}
						// бой продолжается
						} else {
							// следующий выстрел компьютера
							if (player === comp) {
								// увеличиваем счётчик попаданий, равный кол-ву уничтоженных палуб
								comp.tempShip.totalHits++;
								// отмечаем клетки, где точно не может стоять корабль
								var points	= [
									[coords.x - 1, coords.y - 1],
									[coords.x - 1, coords.y + 1],
									[coords.x + 1, coords.y - 1],
									[coords.x + 1, coords.y + 1]
								];
								self.markEmptyCell(points);

								// находим максимально количество палуб из оставшихся кораблей
								var max = self.checkMaxDecks();

								if (comp.tempShip.totalHits >= max) {
									// корабль потоплен
									// помечаем клетки вокруг корабля, как гарантированно пустые
									if (comp.tempShip.totalHits == 1) { // однопалубный
										points = [
											// верхняя
											[comp.tempShip.x0 - 1, comp.tempShip.y0],
											// нижняя
											[comp.tempShip.x0 + 1, comp.tempShip.y0],
											// левая
											[comp.tempShip.x0, comp.tempShip.y0 - 1],
											// правая
											[comp.tempShip.x0, comp.tempShip.y0 + 1],
										];
									// многопалубный корабль
									} else {
										// получаем координаты левой (верхней) клетки для многопалубного корабля
										var x1 = comp.tempShip.x0 - comp.tempShip.kx,
											y1 = comp.tempShip.y0 - comp.tempShip.ky,
											// получаем координаты правой или нижней клетки
											// для этого к координате первой палубы прибавляем количество палуб
											// умноженное на коэффициент, определяющий направление расположения
											// палуб корабля
											x2 = comp.tempShip.x0 + comp.tempShip.kx * comp.tempShip.totalHits,
											y2 = comp.tempShip.y0 + comp.tempShip.ky * comp.tempShip.totalHits;
										points = [
											[x1, y1],
											[x2, y2]
										];
									}
									self.markEmptyCell(points);
									// сбрасываем значения свойств объекта comp.tempShip в исходное состояние;
									self.resetTempShip();
								} else {
									// формируем координаты выстрелов вокруг попадания
									self.setShootMatrixAround();
								}

								// производим новый выстрел
								setTimeout(function() {
									return self.shoot();
								}, 100);
							}
						}
						break;

					// блокируем выстрел по координатам с заштрихованной иконкой
					case 2:
						// выводим предупреждение
						text = 'Снимите блокировку с этих координат!';
						self.showServiseText(text);

						// получаем коллекцию всех объектов маркеров блокированных клеток
						var icons = enemy.field.querySelectorAll('.shaded-cell');
						// перебираем полученную коллекцию иконок
						[].forEach.call(icons, function(el) {
							// преобразуем относительные координаты иконок в координаты матрицы
							var x = el.style.top.slice(0, -2) / comp.shipSide,
								y = el.style.left.slice(0, -2) / comp.shipSide;

							// сравниваем координаты иконок с координатами клика
							if (coords.x == x && coords.y == y) {
								// в случае совпадения координат добавляем маркеру класс,
								// подсвечивающий его в красный цвет
								el.classList.add('shaded-cell_red');
								// через 0.5 сек этот класс удаляем
								setTimeout(function() {
									el.classList.remove('shaded-cell_red');
								}, 500);
							}
						});
						break;
					// обстрелянная координата
					case 3:
					case 4:
						text = 'По этим координатам вы уже стреляли!';
						self.showServiseText(text);
						break;
				}
			},

			showIcons: function(enemy, coords, iconClass) {
				// создаём элемент DIV
				var div = document.createElement('div');
				// присваиваем вновь созданному элементу два класса
				// в зависимости от аргумента iconClass, фоновым рисунком у DIV'а будет или точка,
				// или красный крест, или заштрихованная клетка
				div.className = 'icon-field ' + iconClass;
				// задаём смещение созданного элемента, при этом преобразуем координаты из матричных
				// в относительные (относительно игрового поля противника)
				// для этого значение координаты в сетке матрицы умножаем на ширину клетки
				// игрового поля, которая, как вы помните равна 33px
				div.style.cssText = 'left:' + (coords.y * enemy.shipSide) + 'px; top:' + (coords.x * enemy.shipSide) + 'px;';
				// устанавливаем созданный элемент в игровом поле противника
				enemy.field.appendChild(div);
			},

			setEmptyCell: function(e) {
				// если клик сделан не правой кнопкой мыши, прекращаем работу функции
				if (e.which != 3) return false;
				// блокируем действие браузера по умолчанию - появление
				// контекстного меню
				e.preventDefault();
				// преобразуем относительные координаты клика в координаты
				// двумерного массива (матрицы игрового поля)
				coords = self.transformCoordinates(e, comp);

				// прежде чем штриховать клетку, необходимо проверить пустая ли клетка
				// если там уже есть маркер блокировки, то удалить его,
				// если попадание или промах, то никаких действий не производим
				var ch = self.checkCell();
				// если в выбранной клетке уже установлена какая-то иконка, то
				// ch = false, в противном случае ch = true
				if (ch) {
					// заштриховываем выбранную клетку
					self.showIcons(enemy, coords, 'shaded-cell');
					// записываем в матрице игрового поля компьютера 2,
					// значение заблокированной клетки
					comp.matrix[coords.x][coords.y] = 2;
				}
			},

			// можно переделать, проверять через значение comp.matrix
			// но в таком случае, придётся преобразовывать координаты матрицы в абсолютные
			// координаты и по ним искать DIV для удаления
			checkCell: function() {
				// получаем коллекцию всех иконок, установленных на игровом поле компьютера
				var icons	= enemy.field.querySelectorAll('.icon-field'),
					flag	= true;

				// перебираем полученную коллекцию иконок
				[].forEach.call(icons, function(el) {
					// преобразуем относительные координаты иконок в координаты матрицы
					var x = el.style.top.slice(0, -2) / comp.shipSide,
						y = el.style.left.slice(0, -2) / comp.shipSide;

					// сравниваем координаты иконок с координатами клика
					if (coords.x == x && coords.y == y) {
						// проверяем, какая иконка установлена, используя класс, отвечающий
						// за вывод заштрихованной иконки класс 'shaded-cell'
						var isShaded = el.classList.contains('shaded-cell');
						// если клетка, по которой кликнули, уже заштрихована, то
						if (isShaded) {
							// удаляем эту иконку
							el.parentNode.removeChild(el);
							// записываем в матрице игрового поля компьютера 0,
							// значение пустой клетки
							comp.matrix[coords.x][coords.y] = 0;
						}
						flag = false;
					}
				});
				return flag;
			},

			setShootMatrix: function() {
				// заполняем массив shootMatrix
				for (var i = 0; i < 10; i++) {
					for(var j = 0; j < 10; j++) {
						comp.shootMatrix.push([i, j]);
					}
				}

				// заполняем массив shootMatrixAI
				for (var i = 0, length = comp.startPoints.length; i < length; i++) {
					var arr = comp.startPoints[i];
					for (var j = 0, lh = arr.length; j < lh; j++) {
						var x = arr[j][0],
							y = arr[j][1];

						switch(i) {
							case 0:
								while(x <= 9 && y <= 9) {
									comp.shootMatrixAI.push([x,y]);
									x = (x <= 9) ? x : 9;
									y = (y <= 9) ? y : 9;
									x++; y++;
								};
								break;

							case 1:
								while(x >= 0 && x <= 9 && y <= 9) {
									comp.shootMatrixAI.push([x,y]);
									x = (x >= 0 && x <= 9) ? x : (x < 0) ? 0 : 9;
									y = (y <= 9) ? y : 9;
									x--; y++;
								};
								break;
						}
					}
				}

				// премешиваем массив setShootMatrixAI
				function compareRandom(a, b) {
					return Math.random() - 0.5;
				}
				comp.shootMatrix.sort(compareRandom);
				comp.shootMatrixAI.sort(compareRandom);
				return;
			},

			getCoordinatesShot: function() {
				// если ещё есть координаты выстрелов для реализации оптимальной
				// тактики, получаем их, в противном случае
				// берём координаты очередного выстрела из массива shootMatrix
				coords = (comp.shootMatrixAround.length > 0) ? comp.shootMatrixAround.pop() : (comp.shootMatrixAI.length > 0) ? comp.shootMatrixAI.pop() : comp.shootMatrix.pop();

				// заносим полученные координаты в объект
				var obj = {
					x: coords[0],
					y: coords[1]
				};

				// удаляем выбранные координаты из массива shootMatrix
				// для исключения повторного их обстрела в дальнейшем
				if (comp.shootMatrixAI.length != 0) {
					self.deleteElementMatrix(comp.shootMatrixAI, obj);
				}
				self.deleteElementMatrix(comp.shootMatrix, obj);

				return obj;
			},

			setShootMatrixAround: function() {
				// если положение корабля не определено, то вычисляем его используя
				// координаты первого и второго попадания
				if (comp.tempShip.kx == 0 && comp.tempShip.ky == 0) {
					// проверяем, есть ли в объекте 'tempShip.firstHit' координаты, если нет
					// то будем считать, что это первое попадание и запишем
					// в этот объект координаты первого попадания
					if (Object.keys(comp.tempShip.firstHit).length === 0) {
						comp.tempShip.firstHit = coords;
					} else {
						// запишем координаты второго попадания в объект 'nextHit'
						comp.tempShip.nextHit = coords;
						// вычисляем коэффициенты определяющие положения корабля
						// разность между соответствующими координатами первого и второго
						// попадания не может быть больше 1, в противном случае будем
						// считать, что второе попадание было по другому кораблю
						comp.tempShip.kx = (Math.abs(comp.tempShip.firstHit.x - comp.tempShip.nextHit.x) == 1) ? 1 : 0;
						comp.tempShip.ky = (Math.abs(comp.tempShip.firstHit.y - comp.tempShip.nextHit.y) == 1) ? 1 : 0;
					}
				}

				// корабль расположен вертикально
				if (coords.x > 0 && comp.tempShip.ky == 0) comp.shootMatrixAround.push([coords.x - 1, coords.y]);
				if (coords.x < 9 && comp.tempShip.ky == 0) comp.shootMatrixAround.push([coords.x + 1, coords.y]);
				// корабль расположен горизонтально
				if (coords.y > 0 && comp.tempShip.kx == 0) comp.shootMatrixAround.push([coords.x, coords.y - 1]);
				if (coords.y < 9 && comp.tempShip.kx == 0) comp.shootMatrixAround.push([coords.x, coords.y + 1]);

				// получив координаты обстрела попадания, необходимо проверить их валидность
				// координата валидна, если значение массива не равно или 2 (гарантированно пустая
				// клетка), или 3 (промах), или 4 (попадание)
				for (var i = comp.shootMatrixAround.length - 1; i >= 0; i--) {
					// получаем координаты X и Y возможного выстрела
					var x = comp.shootMatrixAround[i][0],
						y = comp.shootMatrixAround[i][1];
					// проверяем валидность этих координат и если они не валидны - удаляем их из массива
					// координат выстрелов вокруг клетки с попаданием
					if (user.matrix[x][y] !== 0 && user.matrix[x][y] !== 1) {
						comp.shootMatrixAround.splice(i,1);
						self.deleteElementMatrix(comp.shootMatrix, coords);
						// if (comp.shootMatrixAI.length != 0) {
						// 	self.deleteElementMatrix(comp.shootMatrixAI, coords);
						// }
					}
				}
				if (comp.shootMatrixAround.length == 0) {
					// считаем корабль потопленным, сбрасываем свойства объекта tempShip
					// в исходные состояния
					self.resetTempShip();
				}

				return;
			},

			deleteElementMatrix: function(array, obj) {
				for (var i = 0, lh = array.length; i < lh; i++) {
					// находим ячейку массива, в которой содержатся координата
					// равная координате выстрела и удаляем эту ячейку
					if (array[i][0] == obj.x && array[i][1] == obj.y) {
						array.splice(i, 1);
						break;
					}
				}
			},

			resetTempShip: function() {
				// обнуляем массив с координатами обстрела клеток
				// вокруг попадания
				comp.shootMatrixAround = [];
				comp.tempShip = {
					// количество попаданий в корабль
					totalHits: 0,
					// объекты для хранения координат первого и второго попадания
					// необходимы для вычисления положения корабля
					firstHit: {},
					nextHit: {},
					// значения коэффициентов зависит от положения корабля
					// данные значения используются для вычисления координат
					// обстрела "раненого" корабля
					kx: 0,
					ky: 0
				};
			},

			checkMaxDecks: function() {
				var arr = [];
				for (var i = 0, length = user.squadron.length; i < length; i++) {
					// записываем в массив кол-во палуб у оставшихся кораблей
					arr.push(user.squadron[i].decks);
				}
				// возвращаем max значение
				return Math.max.apply(null, arr);
			},

			markEmptyCell: function(points) {
				var obj;

				// перебираем массив с координатами
				for (var i = 0, lh = points.length ; i < lh ; i++) {
					// записываем координаты в объект
					obj = {
						x: points[i][0],
						y: points[i][1]
					};
					// если выполняется хотя бы одно из условий, значит координата находится
					// за пределами игрового поля и она нам не нужна
					// такое возможно, если клетка с попаданием расположена в углу
					// или на краю игрового поля
					// прерываем текущую итерацию и переходим к следующей
					if (obj.x < 0 || obj.x > 9 || obj.y < 0 || obj.y > 9) continue; // за пределами игрового поля

					// песли по данным координатам прописано уже какое-то значение отличное
					// от нуля, значит в этом месте уже стоит отметка или промаха, или попадания,
					// или ранее поставленной пустой клетки
					// прерываем текущую итерацию и переходим к следующей
					if (user.matrix[obj.x][obj.y] != 0) continue;

					// отображаем по данным координатам иконку гарантированно пустой клетки
					self.showIcons(enemy, obj, 'shaded-cell');
					// записываем в двумерный массив игрового поля игрока по данным координатам
					// значение '2', соотвествующее пустой клетке
					user.matrix[obj.x][obj.y] = 2;

					// удаляем из массивов выстрелов данные координаты, чтобы исключить
					// в дальнейшем их обстрел
					self.deleteElementMatrix(comp.shootMatrix, obj);
					if (comp.shootMatrixAround.length != 0) {
						self.deleteElementMatrix(comp.shootMatrixAround, obj);
					}
					if (comp.shootMatrixAI.length != 0) {
						self.deleteElementMatrix(comp.shootMatrixAI, obj);
					}
					self.deleteElementMatrix(comp.shootMatrix, obj);
				}
			},

			transformCoordinates: function(e, instance) {
				// полифил для IE
				if (!Math.trunc) {
					Math.trunc = function(v) {
						v = +v;
						return (v - v % 1) || (!isFinite(v) || v === 0 ? v : v < 0 ? -0 : 0);
					};
				}

				// создадим объект, в который запишем полученные координаты матрицы
				var obj = {};
				// вычисляем ячейку двумерного массива,которая соответствует
				// координатам выстрела
				obj.x = Math.trunc((e.pageY - instance.fieldX) / instance.shipSide),
				obj.y = Math.trunc((e.pageX - instance.fieldY) / instance.shipSide);
				return obj;
			},

			// вывод сообщений в ходе игры
			showServiseText: function(text) {
				// очищаем контейнер от старого сообщения
				srvText.innerHTML = '';
				// выводим новое сообщение
				srvText.innerHTML = text;
				// через секунду сообщение удаляем
				// setTimeout(function() {
				// 	tm = srvText.innerHTML = '';
				// }, 1000);
			}
		};
	
		// делаем доступ к инициализации публичным, т.е. доступным снаружи модуля
		return ({
			battle: battle,
			init: battle.init
		});

	})();
	/////////////////////////////////////////

	function getElement(id) {
		return document.getElementById(id);
	}

	function getRandom(n) {
		// n - максимальное значение, которое хотим получить
		return Math.floor(Math.random() * (n + 1));
	}

	function createMatrix() {
		var x = 10, y = 10, arr = [10];
		for (var i = 0; i < x; i++) {
			arr[i] = [10];
			for(var j = 0; j < y; j++) {
				arr[i][j] = 0;
			}
		}
		return arr;
	}

	function getCoords(el) {
		// получаем объект с координатами всех сторон элемента
		// относительно окна браузера
		var coords = el.getBoundingClientRect();
		// пересчитаем координаты относительно документа, для этого
		// добавим величину прокрутки документа по верикали и горизонтали
		// Если вы расположили игровые поля в верхней части страницы и уверенны,
		// что для их отображения прокручивать страницу не потребуется, то
		// полученные координаты можно не преобразовывать
		return {
			left:	coords.left + window.pageXOffset,
			right:	coords.right + window.pageXOffset,
			top:	coords.top + window.pageYOffset,
			bottom: coords.bottom + window.pageYOffset
		};
	}

	function printMatrix() {
		var print = '';
		for (var x = 0; x < 10; x++) {
			for (var y = 0; y < 10; y++) {
				print += comp.matrix[x][y];
			}
			print += '<br>';
		}
		getElement('matrix').innerHTML = print;
	}

}

