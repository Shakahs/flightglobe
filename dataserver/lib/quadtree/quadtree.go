// Package quadtree implements a quadtree using rectangular partitions.
// Each point exists in a unique Node; if multiple points are in the same position,
// some points may be stored on internal nodes rather than leaf nodes.
// This implementation is based heavily off of the d3 implementation:
// https://github.com/mbostock/d3/wiki/Quadtree-Geom
package quadtree

import (
	"errors"
	"github.com/paulmach/go.geo"
)

var (
	// ErrPointOutsideOfBounds is returned when trying to add a point
	// to a quad tree and the point is outside the bounds used to create the tree.
	ErrPointOutsideOfBounds = errors.New("quadtree: point outside of bounds")
)

// Quadtree implements a two-dimensional recursive spatial subdivision
// of geo.Pointers. This implementation uses rectangular partitions.
type Quadtree struct {
	// Threshold indicates the limit of how deep the quadtree can go.
	// Points closer than this will essentially be put in the same leaf Node and stop recursion.
	// The correct value depends on the use case. The default is computed
	// off the bounds to keep the tree at most 12 levels deep. So points that
	// are closer than 1/4096 * max(bound.width, bound.height) will essentially be
	// stored in the same leaf Node. For optimal tree performance you want this to happen
	// sometimes but not very often.
	bound       *geo.Bound
	Children    [4]*Quadtree
	Points      []*geo.Point
	HasChildren bool
}

// A Filter is a function that returns a boolean value for a given geo.Pointer.
type Filter func(p geo.Pointer) bool

// New creates a new quadtree for the given bound. Added points
// must be within this bound.
func New(bound *geo.Bound) *Quadtree {
	qt := &Quadtree{
		bound: bound,
	}
	qt.HasChildren = false
	return qt
}

// Bound returns the bounds used for the quad tree.
func (q *Quadtree) Bound() *geo.Bound {
	return q.bound
}

func (q *Quadtree) AddPoint(p *geo.Point) {
	q.Points = append(q.Points, p)
	if len(q.Points) > 1000 {
		q.HasChildren = true
		for _, v := range q.Points {
			q.Insert(v)
		}
		q.Points = nil
	}
}

// Insert puts an object into the quad tree, must be within the quadtree bounds.
// If the Pointer returns nil, the point will be ignored.
// This function is not thread-safe, ie. multiple goroutines cannot insert into
// a single quadtree.
func (q *Quadtree) Insert(p geo.Pointer) error {
	if p == nil {
		return nil
	}

	point := p.Point()
	if point == nil {
		return nil
	}

	if !q.bound.Contains(point) {
		return ErrPointOutsideOfBounds
	}

	q.insert(p,
		q.bound.Left(), q.bound.Right(),
		q.bound.Bottom(), q.bound.Top(),
	)

	return nil
}

func (q *Quadtree) insert(p geo.Pointer, left, right, bottom, top float64) {
	point := p.Point()
	if q.HasChildren {
		i := 0
		// figure which child of this internal Node the point is in.
		if cy := (bottom + top) / 2.0; point.Y() <= cy {
			top = cy
			i = 2
		} else {
			bottom = cy
		}

		if cx := (left + right) / 2.0; point.X() >= cx {
			left = cx
			i++
		} else {
			right = cx
		}

		if q.Children[i] == nil {
			q.Children[i] = New(geo.NewBound(left, right, bottom, top))
		}

		q.Children[i].AddPoint(point)
	} else {
		q.AddPoint(point)
	}
}

func WalkQTLeafs(qt *Quadtree, handler func(*Quadtree)) {
	if qt.HasChildren {
		for _, v := range qt.Children {
			if v != nil {
				WalkQTLeafs(v, handler)
			}
		}
	} else {
		handler(qt)
	}
}
