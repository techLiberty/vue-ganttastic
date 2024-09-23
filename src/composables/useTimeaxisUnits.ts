import { computed } from "vue"
import useDayjsHelper from "./useDayjsHelper.js"
import provideConfig from "../provider/provideConfig.js"

export default function useTimeaxisUnits() {
  const { precision } = provideConfig()
  const { chartStartDayjs, chartEndDayjs } = useDayjsHelper()

  const upperPrecision = computed(() => {
    switch (precision?.value) {
      case "hour":
        return "day"
      case "day":
        return "month"
      case "date":
      case "week":
        return "month"
      case "month":
        return "year"
      case "year":
        return "decade"
      default:
        throw new Error(
          "Precision prop incorrect. Must be one of the following: 'hour', 'day', 'date', 'week', 'month', 'year'"
        )
    }
  })

  const lowerPrecision = computed(() => {
    switch (precision.value) {
      case "date":
        return "day"
      case "week":
        return "isoWeek"
      case "year":
        return "year"
      default:
        return precision.value
    }
  })

  const displayFormatsUpper = {
    hour: "h",
    date: "DD",
    day: "DD",
    week: "WW",
    month: "MMM-YY",
    year: "YYYY",
    decade: "YYYY"
  }
  
  const displayFormatsLower = {
    hour: "h",
    date: "DD",
    day: "DD",
    week: "WW",
    month: "MM",
    year: "YY",
    decade: "YYYY"
  }

  const timeaxisUnits = computed(() => {
    const upperUnits: { label: string; value?: string; date: Date; width?: string }[] = []
    const lowerUnits: { label: string; value?: string; date: Date; width?: string }[] = []
    const totalMinutes = chartEndDayjs.value.diff(chartStartDayjs.value, "minutes", true)
    const upperUnit = upperPrecision.value
    const lowerUnit = lowerPrecision.value
    let currentUpperUnit = chartStartDayjs.value
    let currentLowerUnit = chartStartDayjs.value

    //  iterates over the time range, creating lower precision units. For each iteration,
    // it calculates the end of the current lower unit and checks if it is the last item
    // by comparing it with the end date of the chart. It then calculates the width
    // of the current lower unit as a percentage of the total time range.
    while (currentLowerUnit.isSameOrBefore(chartEndDayjs.value)) {
      const endCurrentLowerUnit = currentLowerUnit.endOf(lowerUnit)
      const isLastItem = endCurrentLowerUnit.isAfter(chartEndDayjs.value)

      // Customize lower unit width calculation
      const lowerWidth = isLastItem
        ? (chartEndDayjs.value.diff(currentLowerUnit, "minutes", true) / totalMinutes) * 100
        : (endCurrentLowerUnit.diff(currentLowerUnit, "minutes", true) / totalMinutes) * 100

      lowerUnits.push({
        label: currentLowerUnit.format(displayFormatsLower[precision?.value]),
        value: String(currentLowerUnit),
        date: currentLowerUnit.toDate(),
        width: String(lowerWidth) + "%"
      })
      currentLowerUnit = endCurrentLowerUnit
        .add(1, lowerUnit === "isoWeek" ? "week" : lowerUnit)
        .startOf(lowerUnit)
    }

    //  performs a similar operation for the upper precision units
    while (currentUpperUnit.isSameOrBefore(chartEndDayjs.value)) {
      const yearsToEndOfDecade = 9 - currentUpperUnit.year() % 10;
      const endCurrentUpperUnit =
        upperUnit === "decade"
          ? currentUpperUnit.add(yearsToEndOfDecade, "year").endOf("year")
          : currentUpperUnit.endOf(upperUnit)
      const isLastItem = endCurrentUpperUnit.isAfter(chartEndDayjs.value)

      // Customize upper unit width calculation - This difference is then divided by the total
      // number of minutes in the chart (totalMinutes) to get the proportion of the chart that this unit occupies.
      // The result is multiplied by 100 to convert it to a percentage.
      const upperWidth = isLastItem
        ? (chartEndDayjs.value.diff(currentUpperUnit, "minutes", true) / totalMinutes) * 100
        : (endCurrentUpperUnit.diff(currentUpperUnit, "minutes", true) / totalMinutes) * 100

      upperUnits.push({
        label: currentUpperUnit.format(displayFormatsUpper[upperUnit]),
        value: String(currentUpperUnit),
        date: currentUpperUnit.toDate(),
        width: String(upperWidth) + "%"
      })

      currentUpperUnit =
        upperUnit === "decade"
          ? endCurrentUpperUnit.add(1, "year").startOf("year")
          : endCurrentUpperUnit.add(1, upperUnit).startOf(upperUnit)
    }
    return { upperUnits, lowerUnits }
  })

  return {
    timeaxisUnits
  }
}
