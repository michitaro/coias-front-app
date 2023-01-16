/* eslint-disable */

import { BeautifulObjectLayer, ConstellationLayer, EsoMilkyWayLayer, Globe, GridLayer, HipparcosCatalogLayer, hips } from "@stellar-globe/stellar-globe"
import { createElement, Fragment } from "react"
import { makePureLayerComponent } from "./Globe"



type LayerProps<T> = NonNullable<T extends new (globe: Globe, props: infer R) => unknown ? R : never>
export const Constellation = makePureLayerComponent((globe, props: LayerProps<typeof ConstellationLayer>) => new ConstellationLayer(globe, props))
export const HipparcosCatalog = makePureLayerComponent(globe => new HipparcosCatalogLayer(globe))
export const EsoMilkyWay = makePureLayerComponent(globe => new EsoMilkyWayLayer(globe))
export const Grid = makePureLayerComponent(globe => new GridLayer(globe))
export const HipsSimpleImage = makePureLayerComponent((globe, _: { baseUrl: string }) => new hips.SimpleImageLayer(globe, _.baseUrl))

type BeautifulObjectWhich = ConstructorParameters<typeof BeautifulObjectLayer>[1]
const BeautifulObject = makePureLayerComponent((globe, { which }: { which: BeautifulObjectWhich }) => new BeautifulObjectLayer(globe, which))

export function PrettyPictures() {
  return createElement(Fragment, null,
    createElement(BeautifulObject, { which: 'm31' }),
    createElement(BeautifulObject, { which: 'm42' }),
    createElement(BeautifulObject, { which: 'm45' }),
    createElement(BeautifulObject, { which: "m101" }),
    createElement(BeautifulObject, { which: "perseus" }),
  )
}
