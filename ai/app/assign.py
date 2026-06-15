"""Optimal yolcu→uçuş ataması (min-cost flow, OR-Tools).

Kapasite kısıtı altında toplam maliyeti (ek gecikme + öncelik cezası)
minimize eder. Yüksek öncelikli yolcuların atanmaması pahalı kılınarak
önceliklendirme sağlanır. Atanamayanlar "dummy" düğümüne akar.
"""
from __future__ import annotations

from ortools.graph.python import min_cost_flow

from .schemas import AssignRequest, AssignResponse, Assignment


def optimal_assign(req: AssignRequest) -> AssignResponse:
    passengers = req.passengers
    n = len(passengers)
    if n == 0:
        return AssignResponse(assignments=[], assignedCount=0)

    smcf = min_cost_flow.SimpleMinCostFlow()

    S = 0
    pax_node = [1 + i for i in range(n)]
    next_id = 1 + n

    # (flightId, class) -> (node, capacity, addedDelayMin)
    fc = {}
    for a in req.alternatives:
        if a.economyAvail > 0:
            fc[(a.flightId, "ECONOMY")] = (next_id, a.economyAvail, a.addedDelayMin)
            next_id += 1
        if a.businessAvail > 0:
            fc[(a.flightId, "BUSINESS")] = (next_id, a.businessAvail, a.addedDelayMin)
            next_id += 1

    DUMMY = next_id
    next_id += 1
    T = next_id

    pax_arcs = []  # (arc_index, pax_i, flightId, delay)

    for i, p in enumerate(passengers):
        smcf.add_arc_with_capacity_and_unit_cost(S, pax_node[i], 1, 0)
        for (fid, cls), (node, _cap, delay) in fc.items():
            if cls == p.ticketClass:
                # Yüksek öncelikli yolcu için gecikmenin maliyeti daha ağır →
                # optimizasyon onlara daha düşük gecikmeli uçuşu verir.
                cost = round(delay * (1 + p.priority / 50)) + 1
                arc = smcf.add_arc_with_capacity_and_unit_cost(pax_node[i], node, 1, cost)
                pax_arcs.append((arc, i, fid, delay))
        # atanamama (dummy) — yüksek öncelikli için daha pahalı
        smcf.add_arc_with_capacity_and_unit_cost(pax_node[i], DUMMY, 1, 100000 + p.priority * 100)

    for (_k), (node, cap, _delay) in fc.items():
        smcf.add_arc_with_capacity_and_unit_cost(node, T, cap, 0)
    smcf.add_arc_with_capacity_and_unit_cost(DUMMY, T, n, 0)

    smcf.set_node_supply(S, n)
    smcf.set_node_supply(T, -n)

    status = smcf.solve()
    assigned = {}
    if status == smcf.OPTIMAL:
        for arc, i, fid, delay in pax_arcs:
            if smcf.flow(arc) > 0:
                assigned[i] = (fid, delay)

    assignments = [
        Assignment(
            passengerId=p.passengerId,
            toFlightId=assigned.get(i, (None, None))[0],
            addedDelayMin=assigned.get(i, (None, None))[1],
        )
        for i, p in enumerate(passengers)
    ]
    return AssignResponse(
        assignments=assignments, assignedCount=len(assigned)
    )
