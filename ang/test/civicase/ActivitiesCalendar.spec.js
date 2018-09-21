/* eslint-env jasmine */

(function ($, _, moment) {
  describe('civicaseActivitiesCalendarController', function () {
    var $controller, $scope, $rootScope, activitiesMockData,
      dates, formatActivity, mockCaseId;

    beforeEach(module('civicase', 'civicase.data'));

    beforeEach(inject(function (_$controller_, _$rootScope_,
      _activitiesMockData_, datesMockData, _formatActivity_) {
      $controller = _$controller_;
      $rootScope = _$rootScope_;
      activitiesMockData = _activitiesMockData_.get();
      dates = datesMockData;
      formatActivity = _formatActivity_;
    }));

    describe('calendar options', function () {
      beforeEach(function () {
        initController();
      });

      it('hides the weeks panel from the calendar', function () {
        expect($scope.calendarOptions).toEqual(jasmine.objectContaining({
          showWeeks: false
        }));
      });
    });

    describe('selected activities', function () {
      beforeEach(function () {
        initController();
      });

      describe('when selecting a date with activities included', function () {
        var expectedSelectedActivities;

        beforeEach(function () {
          spyOn($scope, '$emit').and.callThrough();

          expectedSelectedActivities = activitiesMockData
            .filter(function (activity) {
              return moment(activity.activity_date_time).isSame(dates.today, 'day');
            })
            .map(function (activity) {
              return formatActivity(activity, mockCaseId);
            });

          $scope.selectedDate = dates.today;
          $scope.onDateSelected();
        });

        it('only provides the activities for the given date', function () {
          expect($scope.selectedActivites).toEqual(expectedSelectedActivities);
        });

        it('opens the activities popover', function () {
          expect($scope.$emit).toHaveBeenCalledWith('civicaseActivitiesCalendar::openActivitiesPopover');
        });
      });

      describe('when selecting a date with no activities included', function () {
        beforeEach(function () {
          spyOn($scope, '$emit').and.callThrough();

          $scope.selectedDate = dates.nextWeek;
          $scope.onDateSelected();
        });

        it('does not provide any activities for the selected date', function () {
          expect($scope.selectedActivites).toEqual([]);
        });

        it('does not open the activities popover', function () {
          expect($scope.$emit).not.toHaveBeenCalledWith('civicaseActivitiesCalendar::openActivitiesPopover');
        });
      });
    });

    /**
     * Initializes the activities calendar component. Passes the given activities
     * as a binding. If no activities are provided it passes an empty array.
     *
     * @param {Array} activities.
     */
    function initController (activities) {
      $scope = $rootScope.$new();
      activities = activities || activitiesMockData;
      mockCaseId = _.uniqueId();

      $scope.activities = activities;
      $scope.caseId = mockCaseId;

      $controller('civicaseActivitiesCalendarController', { $scope: $scope });
    }
  });

  describe('Activities Calendar DOM Events', function () {
    var $compile, $rootScope, $scope, $timeout, $uibPosition, activitiesMockData, activitiesCalendar;

    beforeEach(module('civicase', 'civicase.data', 'civicase.templates', function ($provide) {
      $uibPosition = jasmine.createSpyObj('$uibPosition', ['positionElements']);

      $uibPosition.positionElements.and.returnValue({ top: 0, left: 0 });
      $provide.value('$uibPosition', $uibPosition);
    }));

    beforeEach(inject(function (_$compile_, _$rootScope_, _$timeout_, _activitiesMockData_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      activitiesMockData = _activitiesMockData_.get();

      $('<div id="bootstrap-theme"></div>').appendTo('body');
    }));

    afterEach(function () {
      activitiesCalendar && activitiesCalendar.remove();
      $('#bootstrap-theme').remove();
      $(document).off('mouseup');
    });

    describe('activities popover', function () {
      beforeEach(function () {
        initDirective();
      });

      describe('when the "open activities popover" event is emitted', function () {
        beforeEach(function () {
          activitiesCalendar.isolateScope().$emit('civicaseActivitiesCalendar::openActivitiesPopover');
          $timeout.flush();
        });

        it('displays the activities popover', function () {
          expect($('.activities-calendar-popover').is(':visible')).toBe(true);
        });
      });

      describe('when the "open activities popover" event is not emitted', function () {
        it('does not display the activities popover', function () {
          expect($('.activities-calendar-popover').is(':visible')).toBe(false);
        });
      });

      describe('closing the popover', function () {
        beforeEach(function () {
          activitiesCalendar.isolateScope().$emit('civicaseActivitiesCalendar::openActivitiesPopover');
          $timeout.flush();
        });

        describe('when clicking outside the popover', function () {
          beforeEach(function () {
            activitiesCalendar.parent().mouseup();
          });

          it('closes the popover', function () {
            expect($('.activities-calendar-popover').is(':visible')).toBe(false);
          });
        });

        describe('when clicking inside the popover', function () {
          beforeEach(function () {
            $('.activities-calendar-popover').mouseup();
          });

          it('does not close the popover', function () {
            expect($('.activities-calendar-popover').is(':visible')).toBe(true);
          });
        });
      });

      describe('opening the popover over the current selected date', function () {
        describe('when opening the popover', function () {
          var activeButton, expectedOffset, popover, jQueryOffsetFn;

          beforeEach(function () {
            var container = $('#bootstrap-theme');
            var mockBodyOffset = { top: 600, left: 500 };
            jQueryOffsetFn = $.fn.offset;

            // Mocking the offset method because the original can fail randomly:
            spyOn($.fn, 'offset').and.returnValue({ top: 200, left: 100 });

            popover = activitiesCalendar.find('.activities-calendar-popover');
            activeButton = activitiesCalendar.find('.uib-day .active');
            expectedOffset = {
              top: mockBodyOffset.top - container.offset().top + 'px',
              left: mockBodyOffset.left - container.offset().left + 'px'
            };

            $uibPosition.positionElements.and.returnValue(mockBodyOffset);
            activitiesCalendar.isolateScope().$emit('civicaseActivitiesCalendar::openActivitiesPopover');
            $timeout.flush();
          });

          afterEach(function () {
            $.fn.offset = jQueryOffsetFn;
          });

          it('appends the popover to the bootstrap theme element', function () {
            expect(popover.parent().is('#bootstrap-theme')).toBe(true);
          });

          it('gets the active element position relative to the body', function () {
            expect($uibPosition.positionElements).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Object), 'bottom', true);
            // this tests that the right elements have been passed to "positionElements":
            expect(activeButton.is($uibPosition.positionElements.calls.mostRecent().args[0])).toEqual(true);
            expect(popover.is($uibPosition.positionElements.calls.mostRecent().args[1])).toEqual(true);
          });

          it('has the same offset as the active day', function () {
            expect(popover.css(['top', 'left']))
              .toEqual(expectedOffset);
          });
        });
      });
    });

    /**
     * Appends a mock calendar table element inside the uib-datepicker element.
     */
    function appendMockCalendarTable () {
      var calendarTable = `<table>
        <tbody>
          <tr class="uib-weeks">
            <td class="uib-day">
              <button><span>28</span></button>
            </td>
            <td class="uib-day">
              <button class="active"><span>29</span></button>
            </td>
            <td class="uib-day">
              <button><span>30</span></button>
            </td>
          </tr>
        </tbody>
      </table>`;

      activitiesCalendar.find('[uib-datepicker]').append(calendarTable);
    }

    /**
     * Initializes the activities calendar dom events directive in the context of its
     * parent controller.
     */
    function initDirective () {
      var html = '<civicase-activities-calendar activities="activities"></civicase-activities-calendar>';
      $scope = $rootScope.$new();
      $scope.activities = activitiesMockData;
      activitiesCalendar = $compile(html)($scope);

      activitiesCalendar.appendTo('body');
      $scope.$digest();
      appendMockCalendarTable();
      activitiesCalendar.find('.popover').hide(); // Bootstrap hides this automatically
    }
  });
})(CRM.$, CRM._, moment);