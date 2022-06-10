'use strict';

angular.module('App.services')
.service('Time', function () {
  var self = this;

  self.timezones = function () {
    var timezones = [
      { value: '-12.0', str: '(GMT -12:00) Eniwetok, Kwajalein' },
      { value: '-11.0', str: '(GMT -11:00) Midway Island, Samoa' },
      { value: '-10.0', str: '(GMT -10:00) Hawaii' },
      { value: '-9.0', str: '(GMT -9:00) Alaska' },
      { value: '-8.0', str: '(GMT -8:00) Pacific Time (US &amp; Canada)' },
      { value: '-7.0', str: '(GMT -7:00) Mountain Time (US &amp; Canada)' },
      { value: '-6.0', str: '(GMT -6:00) Central Time (US &amp; Canada), Mexico City' },
      { value: '-5.0', str: '(GMT -5:00) Eastern Time (US &amp; Canada), Bogota, Lima' },
      { value: '-4.0', str: '(GMT -4:00) Atlantic Time (Canada), Caracas, La Paz' },
      { value: '-3.5', str: '(GMT -3:30) Newfoundland' },
      { value: '-3.0', str: '(GMT -3:00) Brazil, Buenos Aires, Georgetown' },
      { value: '-2.0', str: '(GMT -2:00) Mid-Atlantic' },
      { value: '-1.0', str: '(GMT -1:00) Azores, Cape Verde Islands' },
      { value: '0.0', str: '(GMT) Western Europe Time, London, Lisbon, Casablanca' },
      { value: '+1.0', str: '(GMT +1:00) Brussels, Copenhagen, Madrid, Paris' },
      { value: '+2.0', str: '(GMT +2:00) Kaliningrad, South Africa' },
      { value: '+3.0', str: '(GMT +3:00) Baghdad, Riyadh, Moscow, St. Petersburg' },
      { value: '+3.5', str: '(GMT +3:30) Tehran' },
      { value: '+4.0', str: '(GMT +4:00) Abu Dhabi, Muscat, Baku, Tbilisi' },
      { value: '+4.5', str: '(GMT +4:30) Kabul' },
      { value: '+5.0', str: '(GMT +5:00) Ekaterinburg, Islamabad, Karachi, Tashkent' },
      { value: '+5.5', str: '(GMT +5:30) Bombay, Calcutta, Madras, New Delhi' },
      { value: '+5.45', str: '(GMT +5:45) Kathmandu' },
      { value: '+6.0', str: '(GMT +6:00) Almaty, Dhaka, Colombo' },
      { value: '+7.0', str: '(GMT +7:00) Bangkok, Hanoi, Jakarta' },
      { value: '+8.0', str: '(GMT +8:00) Beijing, Perth, Singapore, Hong Kong' },
      { value: '+9.0', str: '(GMT +9:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk' },
      { value: '+9.5', str: '(GMT +9:30) Adelaide, Darwin' },
      { value: '+10.0', str: '(GMT +10:00) Eastern Australia, Guam, Vladivostok' },
      { value: '+11.0', str: '(GMT +11:00) Magadan, Solomon Islands, New Caledonia' },
      { value: '+12.0', str: '(GMT +12:00) Auckland, Wellington, Fiji, Kamchatka' }
    ];

    return timezones;
  };

  self.find_timezone = function (value) {
    var timezones = self.timezones();

    for(var i=0; i<timezones.length; i++) {
      if (timezones[i].value === value) return timezones[i];
    }

    return null;
  };
});
