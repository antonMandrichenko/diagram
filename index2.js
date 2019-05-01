'use strict';

var doc = document;
var form = doc.forms.mainForm,
  submitButton = form.elements.submit;

var arrOfCurrency = ['AUD','BGN','BRL','CAD','CHF','CNY','CZK','DKK','GBP','HKD','HRK','HUF','IDR','ILS','INR','JPY','KRW','MXN','MYR','NOK','NZD','PHP','PLN','RON','RUB','SEK','SGD','THB','TRY','USD','ZAR'];

var canvasForGraph = doc.getElementById('graphCanvas');
var divCanvas = doc.getElementById('canvas');
var selectBaseCurrency = doc.getElementById('exampleFormControlSelect1');
var selectOurCurrency = doc.getElementById('exampleFormControlSelect2');
var selectStartDay = form.elements.dateStart;
var selectEndDay = form.elements.dateEnd;
var h2 = divCanvas.querySelector('h2');
selectStartDay.value = '2018-01-20';
selectEndDay.value = '2018-02-25';

//create select options of currencies
arrOfCurrency.forEach(function (item) {
  var optionBaseCurrency = doc.createElement('option');
  var optionOurCurrency = doc.createElement('option');
  optionBaseCurrency.innerHTML = item;
  optionOurCurrency.innerHTML = item;
  selectBaseCurrency.appendChild(optionBaseCurrency);
  selectOurCurrency.appendChild(optionOurCurrency);
});

selectBaseCurrency[29].selected = true;
selectOurCurrency[15].selected = true;

function CurrencyDiagram(options) {
  this.startDay = moment(options.dateStart).format('YYYY-MM-DD');
  this.endDay = moment(options.dateEnd).format('YYYY-MM-DD');
  this.baseCurrency = options.baseCurrency;
  this.ourCurrency = options.ourCurrency;
  this.canvas = options.canvas;
  this.ctx = this.canvas.getContext('2d');

  this.getResponses = function () {
    var url = 'https://api.exchangeratesapi.io/history?',
        data = 'start_at=' + this.startDay + '&end_at=' + this.endDay + '&base=' + this.baseCurrency + '&symbols=' + this.ourCurrency;
    fetch(url + data)
      .then((res) => res.json())
      .then((data) => {
        var arrOfRates = [];
        var arrOfDates = Object.keys(data.rates);
        arrOfDates.sort(function (a,b) {
          return moment(a)<moment(b) ? -1 : moment(a)>moment(b) ? 1 : 0;
        });
        arrOfDates.forEach(function (item) {
          for (var key in data.rates) {
            if (key === item) {
              var valueOfRates = data.rates[key][this.ourCurrency];
              if (arrOfRates.indexOf(valueOfRates) === -1) {
                arrOfRates.push(valueOfRates);
              }
            }
          }
        }.bind(this));
        arrOfRates.sort(function (a, b) {
          return a - b;
        });
        this.createDiagram(arrOfRates, arrOfDates, data.rates);
      })
  };

  this.createDiagram = function (arrRates, arrDates, resObject) {
    var period = moment(this.endDay).diff(moment(this.startDay), 'days');
    period > 25 ? this.canvas.height = 1000 : this.canvas.height = 600;
    this.canvas.width = 1100;

    var dY = this.canvas.height / (arrRates.length+arrRates.length/5);
    var dX = this.canvas.width / (arrDates.length+arrRates.length/5);
    var ctx = this.ctx;
    var prevValueI = 0;
    var prevValueJ = 0;

    h2.innerHTML = 'Diagram of exchange rates against a base currency ' + this.baseCurrency + ' for ' + this.ourCurrency;
    h2.classList.add('title');
    divCanvas.insertBefore(h2, this.canvas);

    //draw y-axis
    ctx.beginPath();
    ctx.moveTo(this.canvas.width / 10, this.canvas.height-this.canvas.height / 10);
    ctx.lineTo(this.canvas.width / 10, 0);
    ctx.stroke();
    //draw x-axis
    ctx.beginPath();
    ctx.moveTo(this.canvas.width / 10, this.canvas.height-this.canvas.height / 10);
    ctx.lineTo(this.canvas.width, this.canvas.height-this.canvas.height / 10);
    ctx.stroke();

    for (var i = 0; i < arrRates.length; i++) {
      ctx.beginPath();
      ctx.moveTo(this.canvas.width / 10 - 5, (this.canvas.height-this.canvas.height / 10)-dY*(i+1));
      ctx.lineTo(this.canvas.width / 10 + 5, (this.canvas.height-this.canvas.height / 10)-dY*(i+1));
      ctx.stroke();
      // ctx.font = '4px';
      ctx.fillText(arrRates[i], this.canvas.width / 10 - 100, (this.canvas.height-this.canvas.height / 10)-dY*(i+1));
    }

    arrDates.forEach(function (item, i) {
      ctx.beginPath();
      ctx.moveTo(this.canvas.width / 10 + dX * (i+0.7), this.canvas.height-this.canvas.height / 10 - 5);
      ctx.lineTo(this.canvas.width / 10 + dX * (i+0.7), this.canvas.height-this.canvas.height / 10 + 5);
      ctx.stroke();
      // ctx.beginPath();
      ctx.fillText(moment(arrDates[i]).format('D.M'), this.canvas.width / 10 + dX * (i+0.7), this.canvas.height-this.canvas.height / 10 + 20);
      var that = this;
      for (let key in resObject) {
        if (key === item) {
          ctx.beginPath();

          arrRates.forEach(function (it, j) {
            if (i === 0 && resObject[key][this.ourCurrency] === it) {
              prevValueI = i;
              prevValueJ = j;
              ctx.beginPath();
              ctx.fillRect(this.canvas.width / 10 + dX * (i+0.7), (this.canvas.height-this.canvas.height / 10)-dY*(j+1), 5, 5);
              return;
            }
            if (resObject[key][this.ourCurrency] === it) {
              ctx.moveTo(this.canvas.width / 10 + dX * (prevValueI+0.7), (this.canvas.height-this.canvas.height / 10)-dY*(prevValueJ+1));
              ctx.lineTo(this.canvas.width / 10 + dX * (i+0.7), (this.canvas.height-this.canvas.height / 10)-dY*(j+1));
              prevValueI = i;
              prevValueJ = j;
              ctx.stroke();
              ctx.beginPath();
              ctx.fillRect(this.canvas.width / 10 + dX * (i+0.7)-2.5, (this.canvas.height-this.canvas.height / 10)-dY*(j+1)-2.5, 5, 5);

            }
          }.bind(that))
        }
      }
    }.bind(this));
  };
}

submitButton.onclick = function () {
  var diagram = new CurrencyDiagram({
    canvas: canvasForGraph,
    dateStart: selectStartDay.value,
    dateEnd: selectEndDay.value,
    baseCurrency: selectBaseCurrency.value,
    ourCurrency: selectOurCurrency.value
  });
  diagram.getResponses();
};

form.onchange = function (e) {
  if (e.target.type === 'date' && e.target.id === 'dateStart') {
    if (moment(e.target.value)>moment(selectEndDay.value)) {
      alert('Enter value earlier');
      e.target.value = selectEndDay.value;
    }
    if (e.target.value === selectEndDay.value && (moment(e.target.value).format('ddd') === 'Sat' || moment(e.target.value).format('ddd') === 'Sun')) {
      alert('in saturday or sunday rate of currency is none')
    }
  }
  if (e.target.type === 'date' && e.target.id === 'dateEnd') {
    if (moment(e.target.value)<moment(selectStartDay.value)) {
      alert('Enter value later');
      e.target.value = selectStartDay.value;
    }
    if (e.target.value === selectStartDay.value && (moment(e.target.value).format('ddd') === 'Sat' || moment(e.target.value).format('ddd') === 'Sun')) {
      alert('in saturday or sunday rate of currency is none')
    }
  }
};
